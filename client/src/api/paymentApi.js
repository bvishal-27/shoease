import api from "./axios";

export const createPaymentOrder = async (orderId) => {
  const res = await api.post("/payment/create-order", { orderId });
  return res.data; // { razorpayOrderId, amount, currency, keyId }
};

export const verifyPayment = async (data) => {
  const res = await api.post("/payment/verify", data);
  return res.data.order;
};