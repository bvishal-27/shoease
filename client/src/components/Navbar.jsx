import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "@/redux/authSlice";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const itemsCount = useSelector((state) => state.cart.itemsCount);
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

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link to="/cart" className={buttonVariants({ variant: "ghost" })}>
            Cart
            {user && itemsCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {itemsCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                Hi, {user.name}
              </span>
              {user.role === "admin" && (
                <Link to="/admin" className={buttonVariants({ variant: "ghost" })}>
                  Admin
                </Link>
              )}
                            <Link to="/orders" className={buttonVariants({ variant: "ghost" })}>
                My Orders
              </Link>
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