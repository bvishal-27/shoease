import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats } from "@/api/adminApi";
import { formatPrice, shortOrderId, statusVariant } from "@/lib/format";

const shortDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

function StatCard({ title, value, note, to }) {
  const content = (
    <div className="h-full rounded-xl border bg-card p-5 transition hover:shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getStats(days)
      .then((s) => {
        if (!ignore) setStats(s);
      })
      .catch((err) => {
        if (!ignore) toast.error(err.response?.data?.message || "Could not load stats");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [days]);

  // First load: show a skeleton. Later loads keep the old data on screen.
  if (!stats) {
    return loading ? (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    ) : (
      <p className="py-12 text-center text-muted-foreground">
        Could not load the dashboard. Refresh to try again.
      </p>
    );
  }

  const chartData = stats.sales.map((d) => ({ ...d, label: shortDate(d.date) }));
  const periodSales = stats.sales.reduce((sum, d) => sum + d.sales, 0);
  const periodOrders = stats.sales.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total revenue"
          value={formatPrice(stats.revenue)}
          note="Paid orders, excluding cancelled"
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders}
          note={`${stats.byStatus.Processing} waiting to ship`}
          to="/admin/orders"
        />
        <StatCard title="Users" value={stats.totalUsers} to="/admin/users" />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          note={
            stats.lowStock > 0
              ? `${stats.lowStock} low or out of stock`
              : "All well stocked"
          }
          to="/admin/products"
        />
      </div>

      {/* Sales chart */}
      <section className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Sales</h2>
            <p className="text-sm text-muted-foreground">
              {formatPrice(periodSales)} from {periodOrders} paid order
              {periodOrders === 1 ? "" : "s"} in the last {days} days
            </p>
          </div>
          <div className="flex gap-1">
            {[7, 30].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                onClick={() => setDays(d)}
              >
                {d} days
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                interval={days === 30 ? 4 : 0}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} />
              <Tooltip
                formatter={(value) => [formatPrice(value), "Sales"]}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Orders by status */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-bold">Orders by status</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between">
                <Badge variant={statusVariant(status)}>{status}</Badge>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent orders */}
        <section className="rounded-xl border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {stats.recentOrders.map((o) => (
                <li key={o._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <Link to={`/order/${o._id}`} className="font-medium hover:underline">
                      #{shortOrderId(o._id)}
                    </Link>
                    <p className="truncate text-muted-foreground">
                      {o.user?.name || "Deleted user"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                    <span className="w-24 text-right font-medium">
                      {formatPrice(o.totalPrice)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}