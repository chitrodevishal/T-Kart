import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getPagination = (query, fallbackLimit = 20) => ({
  page: Math.max(1, Number.parseInt(query.page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || fallbackLimit)),
});

export const getDashboard = asyncHandler(async (_req, res) => {
  const [totalProducts, activeProducts, totalCategories, totalCustomers, activeCustomers, totalOrders, paidTotals, recentOrders, lowStockProducts] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6),
    Product.find({ stock: { $lte: 5 }, isActive: true }).select('name sku stock').sort({ stock: 1, name: 1 }).limit(6),
  ]);

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalProducts,
        activeProducts,
        totalCategories,
        totalCustomers,
        activeCustomers,
        totalOrders,
        paidOrders: paidTotals[0]?.count || 0,
        paidRevenue: Math.round((paidTotals[0]?.revenue || 0) * 100) / 100,
      },
      recentOrders,
      lowStockProducts,
    },
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const filter = { role: 'customer' };
  const search = String(req.query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  if (req.query.active === 'true') filter.isActive = true;
  if (req.query.active === 'false') filter.isActive = false;
  const [customers, total] = await Promise.all([
    User.find(filter).select('name email phone isActive createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    count: customers.length,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    data: customers,
  });
});

export const updateCustomerStatus = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return next(new AppError('Invalid customer ID format', 400));
  if (typeof req.body.isActive !== 'boolean') return next(new AppError('isActive must be a boolean', 400));
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    { $set: { isActive: req.body.isActive } },
    { returnDocument: 'after', runValidators: true, select: 'name email phone isActive createdAt' }
  );
  if (!customer) return next(new AppError('Customer not found', 404));
  res.status(200).json({ success: true, message: 'Customer status updated', data: customer });
});

