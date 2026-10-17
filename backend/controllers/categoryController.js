import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get all categories
 * Public endpoint - returns only active categories for non-admin users
 */
export const getAllCategories = asyncHandler(async (req, res, next) => {
  const query = Category.find();

  // Non-admin users can only see active categories
  if (req.user?.role !== 'admin') {
    query.where('isActive').equals(true);
  }

  // Sort by name alphabetically
  query.sort({ name: 1 });

  const categories = await query;

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

/**
 * Get single category by ID
 * Public endpoint - returns active category for non-admin users
 */
export const getCategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const query = Category.findById(id);

  // Non-admin users can only see active categories
  if (req.user?.role !== 'admin') {
    query.where('isActive').equals(true);
  }

  const category = await query;

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * Get category by slug
 * Public endpoint - useful for frontend URL routing
 */
export const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const query = Category.findOne({ slug });

  // Non-admin users can only see active categories
  if (req.user?.role !== 'admin') {
    query.where('isActive').equals(true);
  }

  const category = await query;

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * Create new category (Admin only)
 */
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, image, isActive } = req.body;

  // Validate required fields
  if (typeof name !== 'string' || !name.trim()) {
    return next(new AppError('Please provide a category name', 400));
  }

  // Check if category name already exists
  const normalizedName = name.trim();
  const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existingCategory = await Category.findOne({ name: new RegExp(`^${escapedName}$`, 'i') });
  if (existingCategory) {
    return next(new AppError('A category with this name already exists', 409));
  }

  // Create category (slug will be auto-generated)
  const category = await Category.create({
    name: normalizedName,
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

/**
 * Update category (Admin only)
 */
export const updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, image, isActive } = req.body;

  if (name !== undefined && typeof name !== 'string') {
    return next(new AppError('Category name must be a string', 400));
  }

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // If name is being changed, check if new name already exists
  if (name !== undefined && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const normalizedName = name.trim();
    const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingCategory = await Category.findOne({
      name: new RegExp(`^${escapedName}$`, 'i'),
      _id: { $ne: category._id },
    });
    if (existingCategory) {
      return next(new AppError('A category with this name already exists', 409));
    }
  }

  // Update fields
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (image) category.image = image;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

/**
 * Delete category (Admin only)
 * Safe deletion: checks if products reference this category
 */
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if any products reference this category
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return next(
      new AppError(
        `Cannot delete category: ${productCount} product(s) are still associated with this category. Please reassign or delete the products first.`,
        400
      )
    );
  }

  // Soft delete: set isActive to false
  category.isActive = false;
  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category deactivated successfully',
    data: null,
  });
});

/**
 * Permanently delete category (Admin only)
 * Hard delete - removes document from database
 * Use with caution - recommended to use soft delete instead
 */
export const hardDeleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid category ID format', 400));
  }

  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if any products reference this category
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return next(
      new AppError(
        `Cannot delete category: ${productCount} product(s) are still associated with this category. Please reassign or delete the products first.`,
        400
      )
    );
  }

  await Category.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Category permanently deleted',
    data: null,
  });
});

export default {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
};
