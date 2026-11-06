import express from "express";
import { getStats } from "../controllers/statsController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, admin, getStats);

export default router;