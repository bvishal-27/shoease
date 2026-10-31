import express from "express";
import { getUsers } from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// protect runs first, then admin, then the controller
router.get("/", protect, admin, getUsers);

export default router;