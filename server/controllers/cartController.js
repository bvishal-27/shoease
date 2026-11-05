import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calcPrices } from "../utils/calcPrices.js";

// Builds the cart response the frontend will use
const buildCartResponse = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price images stock"
  );

  // skip items whose product was deleted
  const items = (cart ? cart.items : [])
    .filter((i) => i.product)
    .map((i) => ({
      product: i.product._id,
      name: i.product.name,
      price: i.product.price,
      image: i.product.images[0]?.url || "",
      stock: i.product.stock,
      quantity: i.quantity,
      subtotal: i.product.price * i.quantity,
    }));

  const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemsPrice = items.reduce((sum, i) => sum + i.subtotal, 0);

  return { items, itemsCount, ...calcPrices(itemsPrice) };
};

// Validates a quantity from the request body
const parseQuantity = (value, res) => {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 1) {
    res.status(400);
    throw new Error("Quantity must be a whole number of at least 1");
  }
  return qty;
};

// @desc    Get my cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  const cart = await buildCartResponse(req.user._id);
  res.status(200).json({ success: true, cart });
});

// @desc    Add a product to the cart (adds to quantity if already there)
// @route   POST /api/cart
// @access  Private
// body: { "productId": "...", "quantity": 2 }
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("Please provide productId");
  }
  const qty = parseQuantity(quantity, res);

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existing = cart.items.find((i) => i.product.toString() === productId);
  const newQty = (existing ? existing.quantity : 0) + qty;

  if (newQty > product.stock) {
    res.status(400);
    throw new Error(`Only ${product.stock} item(s) available in stock`);
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }

  await cart.save();
  res.status(200).json({
    success: true,
    cart: await buildCartResponse(req.user._id),
  });
});

// @desc    Set the quantity of a cart item
// @route   PUT /api/cart/:productId
// @access  Private
// body: { "quantity": 3 }
export const updateCartItem = asyncHandler(async (req, res) => {
  const qty = parseQuantity(req.body.quantity, res);

  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (qty > product.stock) {
    res.status(400);
    throw new Error(`Only ${product.stock} item(s) available in stock`);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.find(
    (i) => i.product.toString() === req.params.productId
  );

  if (!item) {
    res.status(404);
    throw new Error("Item not found in cart");
  }

  item.quantity = qty;
  await cart.save();

  res.status(200).json({
    success: true,
    cart: await buildCartResponse(req.user._id),
  });
});

// @desc    Remove one product from the cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(
    (i) => i.product.toString() !== req.params.productId
  );
  await cart.save();

  res.status(200).json({
    success: true,
    cart: await buildCartResponse(req.user._id),
  });
});

// @desc    Empty the cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.status(200).json({
    success: true,
    cart: await buildCartResponse(req.user._id),
  });
});