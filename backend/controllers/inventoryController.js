import mongoose from 'mongoose';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getInventory = asyncHandler(async (req, res, next) => {
  const threshold = req.query.threshold === undefined ? 5 : Number(req.query.threshold);
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isInteger(threshold) || threshold < 0) {
    return next(new AppError('threshold must be a non-negative integer', 400));
  }
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return next(new AppError('page must be positive and limit must be between 1 and 100', 400));
  }

  const filter = req.query.lowStockOnly === 'true' ? { stock: { $lte: threshold } } : {};
  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('name sku stock isActive category updatedAt')
      .populate('category', 'name slug')
      .sort({ stock: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    data: { lowStockThreshold: threshold, products },
  });
});

export const updateProductStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (!mongoose.isValidObjectId(id)) return next(new AppError('Invalid product ID format', 400));
  if (!Number.isInteger(stock) || stock < 0) {
    return next(new AppError('stock must be a non-negative integer', 400));
  }

  const product = await Product.findById(id);
  if (!product) return next(new AppError('Product not found', 404));
  product.stock = stock;
  await product.save();
  await product.populate('category', 'name slug');
  res.status(200).json({ success: true, message: 'Product stock updated', data: product });
});

export default { getInventory, updateProductStock };
