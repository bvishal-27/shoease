import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, checking } = useSelector((state) => state.auth);
  const location = useLocation();

  if (checking) {
    return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  }

  // not logged in: go to login, and remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // logged in but not an admin
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}