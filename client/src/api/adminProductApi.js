import api from "./axios";

// data must be a FormData object (it carries the image files)
export const createProduct = async (data) => {
  const res = await api.post("/products", data);
  return res.data.product;
};

export const updateProduct = async (id, data) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data.product;
};

export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

// Axios sends a DELETE body through the "data" option
export const deleteProductImage = async (id, public_id) => {
  const res = await api.delete(`/products/${id}/images`, { data: { public_id } });
  return res.data.product;
};