import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Sales stats, orders and users come in Part B.
      </p>
      <Link to="/admin/products" className={`${buttonVariants()} mt-6`}>
        Manage products
      </Link>
    </div>
  );
}