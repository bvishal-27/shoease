import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PriceSummary from "@/components/PriceSummary";
import {
  updateCartItem,
  removeFromCart,
  clearCart,
} from "@/redux/cartSlice";
import { formatPrice } from "@/lib/format";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const { items, itemsCount, loaded, updating } = cart;

  // Runs a cart action and shows the server's error message if it fails
  const run = async (action) => {
    try {
      await dispatch(action).unwrap();
    } catch (err) {
      toast.error(err?.message || "Could not update cart");
    }
  };

  const handleClear = () => {
    if (window.confirm("Remove all items from your cart?")) {
      run(clearCart());
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add some products and they will show up here.
        </p>
        <Link to="/" className={`${buttonVariants()} mt-6`}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Shopping cart{" "}
          <span className="text-lg font-normal text-muted-foreground">
            ({itemsCount} item{itemsCount === 1 ? "" : "s"})
          </span>
        </h1>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={updating}>
          Clear cart
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <ul className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <li
              key={item.product}
              className="flex gap-4 rounded-xl border bg-card p-4"
            >
              <Link to={`/product/${item.product}`} className="shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link
                      to={`/product/${item.product}`}
                      className="font-semibold hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(item.subtotal)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {/* Quantity controls */}
                  <div className="flex items-center rounded-md border">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={updating || item.quantity <= 1}
                      onClick={() =>
                        run(
                          updateCartItem({
                            productId: item.product,
                            quantity: item.quantity - 1,
                          })
                        )
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </Button>
                    <span className="w-10 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={updating || item.quantity >= item.stock}
                      onClick={() =>
                        run(
                          updateCartItem({
                            productId: item.product,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.quantity >= item.stock && (
                      <span className="text-xs text-muted-foreground">
                        Max stock reached
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={updating}
                      onClick={() => run(removeFromCart(item.product))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-xl border bg-card p-6 lg:sticky lg:top-6">
          <h2 className="mb-4 text-lg font-bold">Order summary</h2>
          <PriceSummary {...cart} />
          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={updating}
            onClick={() => navigate("/checkout")}
          >
            Proceed to checkout
          </Button>
          <Link
            to="/"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}