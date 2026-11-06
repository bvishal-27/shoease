import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">This page does not exist.</p>
      <Link to="/" className={`${buttonVariants()} mt-6`}>
        Go home
      </Link>
    </div>
  );
}