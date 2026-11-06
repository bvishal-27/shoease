import api from "./axios";

export const getStats = async (days) => {
  const res = await api.get("/admin/stats", { params: { days } });
  return res.data.stats;
};

// params: { status, page, limit }
export const getAllOrders = async (params) => {
  const res = await api.get("/orders", { params });
  return res.data;
};

export const updateOrderStatus = async (id, status) => {
  const res = await api.put(`/orders/${id}/status`, { status });
  return res.data.order;
};

export const getUsers = async () => {
  const res = await api.get("/users");
  return res.data.users;
};

export const updateUserRole = async (id, role) => {
  const res = await api.put(`/users/${id}/role`, { role });
  return res.data.user;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};