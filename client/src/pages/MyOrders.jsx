import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyOrders } from "@/api/orderApi";
import { payForOrder } from "@/lib/pay";
import { formatDate, formatPrice, shortOrderId, statusVariant } from "@/lib/format";

const FILTERS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

const isPayable = (o) =>
  o.paymentMethod === "Razorpay" && !o.isPaid && o.status === "Processing";

export default function MyOrders() {
  const { user } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    getMyOrders()
      .then((list) => {
        if (!ignore) setOrders(list);
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Could not load orders");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { All: orders.length };
    orders.forEach((o) => {
      c[o.status] = (c[o.status] || 0) + 1;
    });
    return c;
  }, [orders]);

  const visible = filter === "All" ? orders : orders.filter((o) => o.status === filter);

  const handlePay = async (order) => {
    try {
      setPayingId(order._id);
      const result = await payForOrder(order, user);

      if (result.status === "paid") {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id
              ? { ...o, isPaid: true, paidAt: result.order.paidAt }
              : o
          )
        );
        toast.success("Payment successful!");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Payment could not be completed"
      );
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="py-16 text-center text-destructive">{error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">No orders yet</h1>
        <p className="mt-2 text-muted-foreground">
          When you place an order, it will show up here.
        </p>
        <Link to="/" className={`${buttonVariants()} mt-6`}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">My orders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f} ({counts[f] || 0})
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No {filter.toLowerCase()} orders.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((o) => {
            const shown = o.orderItems.slice(0, 3);
            const more = o.orderItems.length - shown.length;
            const totalQty = o.orderItems.reduce((s, i) => s + i.quantity, 0);

            return (
              <li key={o._id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/order/${o._id}`}
                      className="font-semibold hover:underline"
                    >
                      Order #{shortOrderId(o._id)}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Placed on {formatDate(o.createdAt)} · {totalQty} item
                      {totalQty === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={o.isPaid ? "default" : "secondary"}>
                      {o.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {shown.map((item) => (
                      <img
                        key={item._id}
                        src={item.image}
                        alt={item.name}
                        title={item.name}
                        className="h-14 w-14 rounded-md border object-cover"
                      />
                    ))}
                    {more > 0 && (
                      <span className="text-sm text-muted-foreground">+{more} more</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{formatPrice(o.totalPrice)}</span>
                    {isPayable(o) && (
                      <Button
                        size="sm"
                        disabled={payingId === o._id}
                        onClick={() => handlePay(o)}
                      >
                        {payingId === o._id ? "Processing..." : "Pay now"}
                      </Button>
                    )}
                    <Link
                      to={`/order/${o._id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}