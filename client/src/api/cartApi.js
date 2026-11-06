import api from "./axios";

// Every function returns the updated cart object from the server

export const getCart = async () => {
  const res = await api.get("/cart");
  return res.data.cart;
};

export const addItem = async (productId, quantity) => {
  const res = await api.post("/cart", { productId, quantity });
  return res.data.cart;
};

export const updateItem = async (productId, quantity) => {
  const res = await api.put(`/cart/${productId}`, { quantity });
  return res.data.cart;
};

export const removeItem = async (productId) => {
  const res = await api.delete(`/cart/${productId}`);
  return res.data.cart;
};

export const clearAll = async () => {
  const res = await api.delete("/cart");
  return res.data.cart;
};