import { toast } from "sonner";
import { loadRazorpay } from "@/lib/razorpay";
import { createPaymentOrder, verifyPayment } from "@/api/paymentApi";

// Opens the Razorpay popup for an order.
// Resolves { status: "paid", order } after the server verified the payment,
// or { status: "dismissed" } if the user closed the popup.
// Throws an error if something goes wrong.
export async function payForOrder(order, user) {
  const loaded = await loadRazorpay();
  if (!loaded) {
    throw new Error("Could not load Razorpay. Check your internet connection");
  }

  // 1. Ask our server to create a Razorpay order for the amount in the DB
  const { razorpayOrderId, amount, currency, keyId } = await createPaymentOrder(
    order._id
  );

  // 2. Open the popup
  return new Promise((resolve, reject) => {
    let completed = false;

    const razorpay = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: "ShopEase",
      description: `Order #${order._id.slice(-8).toUpperCase()}`,
      prefill: {
        name: order.shippingAddress.fullName,
        email: user.email,
        contact: order.shippingAddress.phone,
      },
      theme: { color: "#171717" },

      // 3. Payment done: send the proof to our server to verify
      handler: async (response) => {
        completed = true;
        try {
          const paidOrder = await verifyPayment({
            orderId: order._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve({ status: "paid", order: paidOrder });
        } catch (err) {
          reject(err);
        }
      },

      modal: {
        ondismiss: () => {
          if (!completed) resolve({ status: "dismissed" });
        },
      },
    });

    // A failed attempt: the popup stays open so the user can retry
    razorpay.on("payment.failed", (response) => {
      toast.error(response.error?.description || "Payment failed. Please try again");
    });

    razorpay.open();
  });
}