import crypto from "crypto";
import Order from "../models/Order.js";
import razorpay from "../config/razorpay.js";
import asyncHandler from "../utils/asyncHandler.js";

// Loads an order and makes sure it belongs to the logged-in user
const getMyOrder = async (orderId, req, res) => {
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to pay for this order");
  }

  return order;
};

// @desc    Create a Razorpay order for one of my orders
// @route   POST /api/payment/create-order
// @access  Private
// body: { "orderId": "..." }
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error("Please provide orderId");
  }

  const order = await getMyOrder(orderId, req, res);

  if (order.paymentMethod !== "Razorpay") {
    res.status(400);
    throw new Error("This order is not an online payment order");
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error("This order is already paid");
  }
  if (order.status !== "Processing") {
    res.status(400);
    throw new Error(`Cannot pay for an order that is ${order.status}`);
  }

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100), // Razorpay uses paise
      currency: "INR",
      receipt: order._id.toString(),
    });
  } catch (err) {
    // Razorpay errors keep their message in err.error.description
    res.status(502);
    throw new Error(err?.error?.description || "Could not create payment order");
  }

  // Remember which Razorpay order belongs to this order
  order.paymentResult = { razorpay_order_id: razorpayOrder.id };
  await order.save();

  res.status(200).json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify the payment signature and mark the order as paid
// @route   POST /api/payment/verify
// @access  Private
// body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Missing payment details");
  }

  const order = await getMyOrder(orderId, req, res);

  // Already paid (for example the request was sent twice): just confirm
  if (order.isPaid) {
    return res.status(200).json({ success: true, order });
  }

  if (order.status === "Cancelled") {
    res.status(400);
    throw new Error("This order was cancelled");
  }

  // The payment must belong to the Razorpay order we created for THIS order
  if (order.paymentResult?.razorpay_order_id !== razorpay_order_id) {
    res.status(400);
    throw new Error("Payment does not match this order");
  }

  // Recompute the signature with our secret and compare
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const received = String(razorpay_signature);
  const valid =
    expected.length === received.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));

  if (!valid) {
    res.status(400);
    throw new Error("Payment verification failed");
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };
  await order.save();

  res.status(200).json({ success: true, order });
});