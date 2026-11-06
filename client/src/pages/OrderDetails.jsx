import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PriceSummary from "@/components/PriceSummary";
import { getOrderById, cancelOrder } from "@/api/orderApi";
import { payForOrder } from "@/lib/pay";
import { formatDate, formatPrice } from "@/lib/format";

const statusVariant = (status) => {
  if (status === "Cancelled") return "destructive";
  if (status === "Delivered") return "default";
  return "secondary";
};

// An online-payment order that is still waiting for payment
const isPayable = (o) =>
  o.paymentMethod === "Razorpay" && !o.isPaid && o.status === "Processing";

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const justPlaced = Boolean(location.state?.justPlaced);
  const autoPay = Boolean(location.state?.autoPay);
  const autoPayStarted = useRef(false);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);

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

  const handlePay = async () => {
    try {
      setPaying(true);
      const result = await payForOrder(order, user);

      if (result.status === "paid") {
        // keep the rest of the order (it has the populated user) and update payment info
        setOrder((prev) => ({
          ...prev,
          isPaid: result.order.isPaid,
          paidAt: result.order.paidAt,
          paymentResult: result.order.paymentResult,
        }));
        toast.success("Payment successful!");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Payment could not be completed"
      );
    } finally {
      setPaying(false);
    }
  };

  // Right after checkout with Razorpay: open the payment popup once
  useEffect(() => {
    if (!order || !autoPay || autoPayStarted.current) return;
    autoPayStarted.current = true;

    // remove autoPay from the history entry so a refresh doesn't reopen the popup
    navigate(location.pathname, { replace: true, state: { justPlaced: true } });

    if (isPayable(order)) handlePay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

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

   // only the customer who placed the order can pay for it or cancel it
  const isOwner = order.user?._id === user._id;
  const canCancel = isOwner && order.status === "Processing" && !order.isPaid;
  const canPay = isOwner && isPayable(order);

  const a = order.shippingAddress;

  return (
    <div>
      {justPlaced && (
        <div className="mb-6 rounded-xl border border-green-600/30 bg-green-600/10 p-6 text-center">
          <h1 className="text-2xl font-bold">
            {order.isPaid
              ? "Payment successful! Your order is placed 🎉"
              : "Thank you! Your order is placed 🎉"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Order #{shortId}.{" "}
            {canPay
              ? "Complete the payment below to confirm it."
              : "You can track it on this page."}
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
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay (online)"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.isPaid ? `Paid on ${formatDate(order.paidAt)}` : "Not paid yet"}
            </p>
            {order.paymentResult?.razorpay_payment_id && (
              <p className="mt-1 break-all text-xs text-muted-foreground">
                Payment ID: {order.paymentResult.razorpay_payment_id}
              </p>
            )}
            {order.deliveredAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                Delivered on {formatDate(order.deliveredAt)}
              </p>
            )}

            {canPay && (
              <Button
                className="mt-4 w-full"
                onClick={handlePay}
                disabled={paying || cancelling}
              >
                {paying ? "Processing..." : `Pay ${formatPrice(order.totalPrice)} now`}
              </Button>
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
              disabled={cancelling || paying}
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