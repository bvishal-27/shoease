import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT to every request automatically
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("shopease_user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch {
    // ignore bad JSON in storage
  }
  return config;
});

export default api;