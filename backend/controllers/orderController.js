import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { syncDummyJsonCatalog } from '../services/dummyJsonCatalogService.js';

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const rollbackStock = async (reserved) => {
  for (const item of reserved.reverse()) {
    await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
  }
};

export const createOrder = asyncHandler(async (req, res, next) => {
  await syncDummyJsonCatalog();
  const shippingAddress = req.body?.shippingAddress;
  const requiredAddressFields = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode'];
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress) ||
      requiredAddressFields.some((field) => typeof shippingAddress[field] !== 'string' || !shippingAddress[field].trim())) {
    return next(new AppError('Provide fullName, phone, address, city, state, and postalCode in shippingAddress', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart?.items.length) return next(new AppError('Your cart is empty', 400));

  const lines = [];
  const productById = new Map();
  for (const item of cart.items) {
    const id = item.product.toString();
    let product = productById.get(id);
    if (!product) {
      product = await Product.findOne({ _id: id, isActive: true }).populate('category', 'name');
      if (!product) return next(new AppError('A cart product is no longer available', 409));
      productById.set(id, product);
    }
    lines.push({ product, quantity: item.quantity });
  }

  const reserved = [];
  try {
    for (const { product, quantity } of lines) {
      const result = await Product.updateOne(
        { _id: product._id, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw new AppError(`Insufficient stock for ${product.name}`, 409);
      }
      reserved.push({ productId: product._id, quantity });
    }

    const orderItems = lines.map(({ product, quantity }) => ({
      product: product._id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      discount: product.discount,
      finalPrice: product.finalPrice,
      quantity,
      image: product.image || product.images[0] || '',
      imageSource: product.imageSource || '',
      imageCredit: product.imageCredit || '',
      imageCreditUrl: product.imageCreditUrl || '',
      imageSourceUrl: product.imageSourceUrl || '',
      categoryName: product.category?.name || '',
    }));
    const itemsTotal = roundMoney(orderItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0));
    const order = await Order.create({
      orderNumber: `TK-${Date.now()}-${randomUUID().slice(0, 8)}`,
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentInfo: { method: 'mock_card', status: 'pending' },
      itemsTotal,
      shippingFee: 0,
      tax: 0,
      totalAmount: itemsTotal,
    });

    try {
      cart.items = [];
      cart.subtotal = 0;
      cart.discountTotal = 0;
      cart.total = 0;
      await cart.save();
    } catch (cartError) {
      await Order.deleteOne({ _id: order._id });
      throw cartError;
    }

    return res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    await rollbackStock(reserved);
    throw error;
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);
  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    data: orders,
  });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('Invalid order ID format', 400));
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.user = req.user._id;
  const order = await Order.findOne(filter);
  if (!order) return next(new AppError('Order not found', 404));
  res.status(200).json({ success: true, data: order });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    data: orders,
  });
});

const allowedTransitions = {
  placed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus, cancellationReason } = req.body;
  if (!mongoose.isValidObjectId(id)) return next(new AppError('Invalid order ID format', 400));
  if (!Object.hasOwn(allowedTransitions, orderStatus)) return next(new AppError('Invalid order status', 400));

  const order = await Order.findById(id);
  if (!order) return next(new AppError('Order not found', 404));
  if (!allowedTransitions[order.orderStatus].includes(orderStatus)) {
    return next(new AppError(`Cannot transition order from ${order.orderStatus} to ${orderStatus}`, 409));
  }
  if (orderStatus === 'processing' && order.paymentInfo.status !== 'paid') {
    return next(new AppError('Only paid orders can enter processing', 409));
  }
  if (orderStatus === 'cancelled' && order.paymentInfo.status === 'paid') {
    return next(new AppError('Paid orders cannot be cancelled without a refund workflow', 409));
  }
  if (orderStatus === 'cancelled' && order.paymentInfo.status === 'processing') {
    return next(new AppError('Cannot cancel while a payment attempt is processing', 409));
  }

  const previousStatus = order.orderStatus;
  if (orderStatus === 'cancelled') {
    const claim = await Order.findOneAndUpdate(
      { _id: id, orderStatus: previousStatus, 'paymentInfo.status': order.paymentInfo.status, isInventoryRestored: false },
      { $set: { orderStatus, isInventoryRestored: true, cancelledAt: new Date(), cancellationReason: cancellationReason || null } },
      { returnDocument: 'after' }
    );
    if (!claim) return next(new AppError('Order status changed concurrently; reload and retry', 409));

    const restored = [];
    try {
      for (const item of order.orderItems) {
        const result = await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        if (result.matchedCount !== 1) throw new Error(`Could not restore inventory for product ${item.product}`);
        restored.push({ productId: item.product, quantity: item.quantity });
      }
    } catch (error) {
      for (const item of restored.reverse()) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } });
      }
      await Order.updateOne(
        { _id: id, orderStatus: 'cancelled', isInventoryRestored: true },
        { $set: { orderStatus: previousStatus, isInventoryRestored: false, cancelledAt: null, cancellationReason: null } }
      );
      throw error;
    }
    return res.status(200).json({ success: true, message: 'Order cancelled and inventory restored', data: claim });
  }

  if (orderStatus === 'delivered') order.deliveredAt = new Date();
  order.orderStatus = orderStatus;
  await order.save();
  res.status(200).json({ success: true, message: 'Order status updated', data: order });
});

export default { createOrder, getMyOrders, getOrderById, getAdminOrders, updateOrderStatus };
