import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// every cart route needs a logged-in user
router.use(protect);

router.route("/").get(getCart).post(addToCart).delete(clearCart);
router.route("/:productId").put(updateCartItem).delete(removeFromCart);

export default router;