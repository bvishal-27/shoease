import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import ProductDetails from "@/pages/ProductDetails";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderDetails from "@/pages/OrderDetails";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import { fetchMe } from "@/redux/authSlice";
import { fetchCart } from "@/redux/cartSlice";

export default function App() {
  const dispatch = useDispatch();
  const { user, checking } = useSelector((state) => state.auth);

  // On first load, verify the saved token with the server
  useEffect(() => {
    if (user?.token) {
      dispatch(fetchMe());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the cart once we know who the user is (after login or page refresh)
  useEffect(() => {
    if (user?._id && !checking) {
      dispatch(fetchCart());
    }
  }, [user?._id, checking, dispatch]);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderDetails />} />
          </Route>

          {/* admins only */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <Toaster richColors position="top-right" />
    </>
  );
}