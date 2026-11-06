import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/Pagination";
import { getAllOrders, updateOrderStatus } from "@/api/adminApi";
import { formatDate, formatPrice, shortOrderId, statusVariant } from "@/lib/format";

const PAGE_SIZE = 10;
const STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

// What an admin can do next. Delivered and Cancelled orders are final.
const NEXT_ACTIONS = {
  Processing: [
    { status: "Shipped", label: "Mark shipped" },
    { status: "Cancelled", label: "Cancel", danger: true },
  ],
  Shipped: [
    { status: "Delivered", label: "Mark delivered" },
    { status: "Cancelled", label: "Cancel", danger: true },
  ],
};

export default function AdminOrders() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const params = { page, limit: PAGE_SIZE };
    if (status !== "all") params.status = status;

    getAllOrders(params)
      .then((result) => {
        if (ignore) return;
        setData(result);
      })
      .catch((err) => {
        if (ignore) return;
        toast.error(err.response?.data?.message || "Could not load orders");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [status, page, reload]);

  const handleAction = async (order, action) => {
    if (action.status === "Cancelled") {
      const warning = order.isPaid
        ? "This order is already PAID. Cancelling restores stock but does not refund the money. You must refund it in the Razorpay dashboard. Continue?"
        : "Cancel this order and put its items back in stock?";
      if (!window.confirm(warning)) return;
    }

    try {
      setUpdatingId(order._id);
      await updateOrderStatus(order._id, action.status);
      toast.success(`Order marked ${action.status}`);
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {data.total} order{data.total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="w-48">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.orders.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No orders found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>
                    <Link
                      to={`/order/${o._id}`}
                      className="font-medium hover:underline"
                    >
                      #{shortOrderId(o._id)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{o.user?.name || "Deleted user"}</p>
                    <p className="text-xs text-muted-foreground">{o.user?.email}</p>
                  </TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>{formatPrice(o.totalPrice)}</TableCell>
                  <TableCell>
                    <p className="text-sm">{o.paymentMethod}</p>
                    <Badge variant={o.isPaid ? "default" : "secondary"}>
                      {o.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {(NEXT_ACTIONS[o.status] || []).map((action) => (
                        <Button
                          key={action.status}
                          size="sm"
                          variant={action.danger ? "ghost" : "outline"}
                          className={action.danger ? "text-destructive" : ""}
                          disabled={updatingId === o._id}
                          onClick={() => handleAction(o, action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                      {!NEXT_ACTIONS[o.status] && (
                        <span className="text-xs text-muted-foreground">Final</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}