import api from "./axios";

// params: { keyword, category, minPrice, maxPrice, sort, page, limit }
export const getProducts = async (params, signal) => {
  const res = await api.get("/products", { params, signal });
  return res.data;
};

export const getCategories = async () => {
  const res = await api.get("/products/categories");
  return res.data.categories;
};

export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data.product;
};

export const addReview = async (id, data) => {
  const res = await api.post(`/products/${id}/reviews`, data);
  return res.data;
};