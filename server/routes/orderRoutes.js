import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// Must come BEFORE "/:id", otherwise "myorders" is treated as an id
router.get("/myorders", protect, getMyOrders);

router.get("/:id", protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;