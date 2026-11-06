import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "@/redux/authSlice";

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          ShopEase
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Hi, {user.name}
              </span>
              {user.role === "admin" && (
                <Link to="/admin" className={buttonVariants({ variant: "ghost" })}>
                  Admin
                </Link>
              )}
              <Link to="/profile" className={buttonVariants({ variant: "ghost" })}>
                Profile
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost" })}>
                Login
              </Link>
              <Link to="/register" className={buttonVariants()}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}