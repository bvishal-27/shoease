import Order, { ORDER_STATUSES } from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const TZ = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-11-06" for a date, in Indian time
const dayKey = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: TZ });

// Revenue only counts paid orders that were not cancelled
const PAID = { isPaid: true, status: { $ne: "Cancelled" } };

// @desc    Dashboard statistics
// @route   GET /api/admin/stats?days=7|30
// @access  Private/Admin
export const getStats = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) === 30 ? 30 : 7;
  const since = new Date(Date.now() - days * DAY_MS);

  const [
    revenueAgg,
    salesAgg,
    statusAgg,
    totalOrders,
    totalUsers,
    totalProducts,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: PAID },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    Order.aggregate([
      { $match: { ...PAID, paidAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: TZ } },
          sales: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: 5 } }),
    Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("user totalPrice status isPaid createdAt"),
  ]);

  // One entry per day, including days with no sales (so the chart has no gaps)
  const salesByDay = new Map(salesAgg.map((d) => [d._id, d]));
  const sales = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayKey(Date.now() - i * DAY_MS);
    const found = salesByDay.get(date);
    sales.push({
      date,
      sales: found ? Math.round(found.sales * 100) / 100 : 0,
      orders: found ? found.orders : 0,
    });
  }

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  statusAgg.forEach((s) => {
    byStatus[s._id] = s.count;
  });

  res.status(200).json({
    success: true,
    stats: {
      revenue: revenueAgg[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      lowStock,
      byStatus,
      sales,
      recentOrders,
    },
  });
});