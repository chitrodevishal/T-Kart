import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { syncDummyJsonCatalog } from '../services/dummyJsonCatalogService.js';

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const validateQuantity = (quantity, next) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    next(new AppError('Quantity must be a positive integer', 400));
    return false;
  }
  return true;
};

const saveCart = async (cart, res, status = 200, message = 'Cart retrieved successfully') => {
  await cart.recalculateTotals();
  await cart.save();
  res.status(status).json({ success: true, message, data: cart });
};

export const getCart = asyncHandler(async (req, res) => {
  await syncDummyJsonCatalog();
  const cart = await getOrCreateCart(req.user._id);
  await saveCart(cart, res);
});

export const addCartItem = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  if (!mongoose.isValidObjectId(productId)) {
    return next(new AppError('A valid productId is required', 400));
  }
  if (!validateQuantity(quantity, next)) return;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) return next(new AppError('Active product not found', 404));

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find(({ product: id }) => id.toString() === product._id.toString());
  const nextQuantity = (item?.quantity || 0) + quantity;
  if (nextQuantity > product.stock) {
    return next(new AppError(`Only ${product.stock} unit(s) are currently available`, 409));
  }
  if (item) item.quantity = nextQuantity;
  else cart.items.push({ product: product._id, quantity });

  await saveCart(cart, res, 201, 'Product added to cart');
});

export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  if (!mongoose.isValidObjectId(itemId)) return next(new AppError('Invalid cart item ID format', 400));
  if (!validateQuantity(quantity, next)) return;

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);
  if (!item) return next(new AppError('Cart item not found', 404));
  const product = await Product.findOne({ _id: item.product, isActive: true });
  if (!product) return next(new AppError('Active product not found', 404));
  if (quantity > product.stock) {
    return next(new AppError(`Only ${product.stock} unit(s) are currently available`, 409));
  }

  item.quantity = quantity;
  await saveCart(cart, res, 200, 'Cart item quantity updated');
});

export const removeCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  if (!mongoose.isValidObjectId(itemId)) return next(new AppError('Invalid cart item ID format', 400));
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);
  if (!item) return next(new AppError('Cart item not found', 404));
  item.deleteOne();
  await saveCart(cart, res, 200, 'Cart item removed');
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.subtotal = 0;
  cart.discountTotal = 0;
  cart.total = 0;
  await cart.save();
  res.status(200).json({ success: true, message: 'Cart cleared', data: cart });
});

export default { getCart, addCartItem, updateCartItem, removeCartItem, clearCart };
