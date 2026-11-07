import Order, { ORDER_STATUSES } from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calcPrices } from "../utils/calcPrices.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderConfirmationEmail } from "../utils/emailTemplates.js";

// Puts the items of an order back into stock (used when cancelling)
const restoreStock = async (order) => {
  await Promise.all(
    order.orderItems.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
    )
  );
};

// @desc    Place an order from my cart
// @route   POST /api/orders
// @access  Private
// body: { "shippingAddress": {...}, "paymentMethod": "Razorpay" | "COD" }
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "Razorpay" } = req.body;

  // 1. Validate address and payment method
  const required = ["fullName", "phone", "address", "city", "state", "postalCode"];
  const missing = required.filter((f) => !shippingAddress?.[f]);
  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Missing shipping fields: ${missing.join(", ")}`);
  }
  if (!["Razorpay", "COD"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("Payment method must be Razorpay or COD");
  }

  // 2. Read the cart (prices come from the database)
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const cartItems = cart ? cart.items.filter((i) => i.product) : [];

  if (cartItems.length === 0) {
    res.status(400);
    throw new Error("Your cart is empty");
  }

  // 3. Reserve stock atomically, one product at a time.
  //    If anything fails, we put back what we already took.
  const reserved = [];
  let order;

  try {
    for (const item of cartItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (!updated) {
        res.status(400);
        throw new Error(`Not enough stock for "${item.product.name}"`);
      }
      reserved.push(item);
    }

    // 4. Create the order with a snapshot of the items
    const orderItems = cartItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url || "",
      price: item.product.price,
      quantity: item.quantity,
    }));

    const itemsPrice = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      ...calcPrices(itemsPrice),
    });
  } catch (error) {
    await Promise.all(
      reserved.map((item) =>
        Product.updateOne(
          { _id: item.product._id },
          { $inc: { stock: item.quantity } }
        )
      )
    );
    throw error;
  }

  // 5. Empty the cart
  cart.items = [];
  await cart.save();

  // 6. Confirmation email (not awaited: the response does not wait for it)
  sendEmail({ to: req.user.email, ...orderConfirmationEmail(order, req.user) });


  
  res.status(201).json({ success: true, order });
});

// @desc    Get my orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Get one order (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.status(200).json({ success: true, order });
});

// @desc    Cancel my order (only while Processing and unpaid)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (order.status !== "Processing") {
    res.status(400);
    throw new Error(`Cannot cancel an order that is ${order.status}`);
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error("Paid orders cannot be cancelled here. Please contact support");
  }

  await restoreStock(order);
  order.status = "Cancelled";
  await order.save();

  res.status(200).json({ success: true, order });
});

// @desc    Get all orders (filter by status, paginate)
// @route   GET /api/orders?status=&page=&limit=
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;

  const query = {};
  if (status) {
    if (!ORDER_STATUSES.includes(status)) {
      res.status(400);
      throw new Error(`Status must be one of: ${ORDER_STATUSES.join(", ")}`);
    }
    query.status = status;
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    orders,
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
// body: { "status": "Shipped" }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${ORDER_STATUSES.join(", ")}`);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (["Delivered", "Cancelled"].includes(order.status)) {
    res.status(400);
    throw new Error(`Order is already ${order.status} and cannot be changed`);
  }

  if (status === "Cancelled") {
    await restoreStock(order);
  }

  if (status === "Delivered") {
    order.deliveredAt = new Date();
    // Cash on delivery is paid when the parcel is delivered
    if (order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paidAt = new Date();
    }
  }

  order.status = status;
  await order.save();

  res.status(200).json({ success: true, order });
});