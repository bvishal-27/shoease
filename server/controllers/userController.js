import User from "../models/User.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, users });
});

// @desc    Change a user's role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
// body: { "role": "admin" | "user" }
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Role must be user or admin");
  }

  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot change your own role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ success: true, user });
});

// @desc    Delete a user (only if they have no orders)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (await Order.exists({ user: user._id })) {
    res.status(400);
    throw new Error("This user has orders and cannot be deleted");
  }

  await Cart.deleteOne({ user: user._id });
  await user.deleteOne();

  res.status(200).json({ success: true, message: "User deleted" });
});