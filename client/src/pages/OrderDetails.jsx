import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PriceSummary from "@/components/PriceSummary";
import { getOrderById, cancelOrder } from "@/api/orderApi";
import { formatDate, formatPrice } from "@/lib/format";

const statusVariant = (status) => {
  if (status === "Cancelled") return "destructive";
  if (status === "Delivered") return "default";
  return "secondary";
};

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = Boolean(location.state?.justPlaced);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    getOrderById(id)
      .then((o) => {
        if (!ignore) setOrder(o);
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Could not load order");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      setCancelling(true);
      const updated = await cancelOrder(id);
      setOrder((prev) => ({ ...prev, status: updated.status }));
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">{error || "Order not found"}</h1>
        <Link to="/" className={`${buttonVariants()} mt-6`}>
          Back to shop
        </Link>
      </div>
    );
  }

  const shortId = order._id.slice(-8).toUpperCase();
  const canCancel = order.status === "Processing" && !order.isPaid;
  const a = order.shippingAddress;

  return (
    <div>
      {justPlaced && (
        <div className="mb-6 rounded-xl border border-green-600/30 bg-green-600/10 p-6 text-center">
          <h1 className="text-2xl font-bold">Thank you! Your order is placed 🎉</h1>
          <p className="mt-1 text-muted-foreground">
            Order #{shortId}. You can track it on this page.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Order #{shortId}</h2>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <ul className="space-y-4 lg:col-span-2">
          {order.orderItems.map((item) => (
            <li
              key={item._id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <Link
                  to={`/product/${item.product}`}
                  className="font-semibold hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        {/* Side info */}
        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 font-bold">Shipping address</h3>
            <p className="text-sm">{a.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {a.address}, {a.city}, {a.state} {a.postalCode}, {a.country}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Phone: {a.phone}</p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 font-bold">Payment</h3>
            <p className="text-sm">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.isPaid ? `Paid on ${formatDate(order.paidAt)}` : "Not paid yet"}
            </p>
            {order.deliveredAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                Delivered on {formatDate(order.deliveredAt)}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 font-bold">Price details</h3>
            <PriceSummary {...order} />
          </div>

          {canCancel && (
            <Button
              variant="outline"
              className="w-full text-destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel order"}
            </Button>
          )}

          <Link to="/" className={`${buttonVariants({ variant: "ghost" })} w-full`}>
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}