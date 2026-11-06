import api from "./axios";

export const createOrder = async (data) => {
  const res = await api.post("/orders", data);
  return res.data.order;
};

export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data.order;
};

export const cancelOrder = async (id) => {
  const res = await api.put(`/orders/${id}/cancel`);
  return res.data.order;
};

// used in Chapter 9 (order history page)
export const getMyOrders = async () => {
  const res = await api.get("/orders/myorders");
  return res.data.orders;
};