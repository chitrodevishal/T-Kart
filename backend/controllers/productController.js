import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';
import productImageService from '../services/productImageService.js';

const normalizeRequestedImages = (image, images, next) => {
  const requested = [];
  if (image !== undefined) {
    if (typeof image !== 'string') {
      next(new AppError('image must be an HTTPS URL string', 400));
      return null;
    }
    if (image.trim()) requested.push(image.trim());
  }
  if (images !== undefined) {
    const values = typeof images === 'string' ? [images] : images;
    if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
      next(new AppError('images must be an array of HTTPS URL strings', 400));
      return null;
    }
    requested.push(...values.map((value) => value.trim()).filter(Boolean));
  }

  const unique = [...new Set(requested)];
  if (unique.some((url) => !isValidExternalImageUrl(url))) {
    next(new AppError('Product images must use valid external HTTPS URLs', 400));
    return null;
  }
  return unique;
};

const setProductImage = (product, imageData) => {
  product.image = imageData.image;
  product.images = imageData.images;
  product.imageSource = imageData.imageSource;
  product.imageCredit = imageData.imageCredit || '';
  product.imageCreditUrl = imageData.imageCreditUrl || '';
  product.imageSourceUrl = imageData.imageSourceUrl || '';
};

const isLegacyAutoImage = (product) => {
  if (product.imageSource === 'title-fallback') return false;
  const image = product.image || product.images?.[0] || '';
  try {
    return new URL(image).hostname.toLowerCase() === 'loremflickr.com';
  } catch {
    return false;
  }
};

const getUsedImageUrls = async (excludeId) => {
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};
  const products = await Product.find(filter).select('image images').lean();
  return [...new Set(products.flatMap((product) => [product.image, ...(product.images || [])]).filter(isValidExternalImageUrl))];
};

const getCategoryName = async (categoryId) => {
  const category = await Category.findById(categoryId).select('name');
  return category?.name || '';
};

/**
 * Get all products with search, filtering, sorting, and pagination
 * Public endpoint - returns only active products for non-admin users
 */
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const min = minPrice === undefined ? undefined : Number(minPrice);
  const max = maxPrice === undefined ? undefined : Number(maxPrice);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return next(new AppError('page must be a positive integer', 400));
  }
  if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
    return next(new AppError('limit must be an integer between 1 and 100', 400));
  }
  if ((min !== undefined && (!Number.isFinite(min) || min < 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max < 0))) {
    return next(new AppError('Price filters must be non-negative numbers', 400));
  }
  if (min !== undefined && max !== undefined && min > max) {
    return next(new AppError('minPrice cannot be greater than maxPrice', 400));
  }
  if (!['asc', 'desc'].includes(sortOrder)) {
    return next(new AppError('sortOrder must be either asc or desc', 400));
  }

  const filter = {};
  if (req.user?.role !== 'admin') filter.isActive = true;
  if (search?.trim()) filter.$text = { $search: search.trim() };
  if (category) {
    if (mongoose.isValidObjectId(category)) {
      filter.category = category;
    } else {
      const categoryDoc = await Category.findOne({ slug: category });
      // No matching slug should produce an empty result set, not an unfiltered catalog.
      filter.category = categoryDoc?._id ?? new mongoose.Types.ObjectId();
    }
  }
  if (min !== undefined || max !== undefined) {
    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  const validSortFields = ['name', 'price', 'createdAt', 'stock', 'ratingsAverage'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const skip = (pageNum - 1) * limitNum;
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ [sortField]: sortDirection }).skip(skip).limit(limitNum)
      .populate('category', 'name slug image'),
    Product.countDocuments(filter),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    success: true,
    count: products.length,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: total,
      limit: limitNum,
      hasNextPage,
      hasPrevPage,
    },
    data: products,
  });
});

/**
 * Get single product by ID
 * Public endpoint - returns active product for non-admin users
 */
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid product ID format', 400));
  }

  const query = Product.findById(id).populate('category', 'name slug image');

  // Non-admin users can only see active products
  if (req.user?.role !== 'admin') {
    query.where('isActive').equals(true);
  }

  const product = await query;

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * Create new product (Admin only)
 */
export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, description, sku, price, discount, category, stock, image, images, isActive } = req.body;

  // Validate required fields
  if (typeof name !== 'string' || name.trim().length < 2 || typeof description !== 'string' || typeof sku !== 'string' ||
      price === undefined || !category) {
    return next(new AppError('Please provide name, description, SKU, price, and category', 400));
  }

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingProduct) {
    return next(new AppError('A product with this SKU already exists', 409));
  }

  // Validate category exists
  if (!mongoose.isValidObjectId(category)) {
    return next(new AppError('Invalid category ID format', 400));
  }
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    return next(new AppError('Category not found', 404));
  }

  const requestedImages = normalizeRequestedImages(image, images, next);
  if (!requestedImages) return;
  const imageData = requestedImages.length
    ? { image: requestedImages[0], images: requestedImages, imageSource: 'manual' }
    : await productImageService.lookup(name, categoryDoc.name, {
      excludeImageUrls: await getUsedImageUrls(),
      cacheKeySuffix: sku.toUpperCase(),
    });

  // Create product
  const product = await Product.create({
    name,
    description,
    sku: sku.toUpperCase(),
    price,
    discount: discount === undefined ? 0 : discount,
    category,
    stock: stock === undefined ? 0 : stock,
    ...imageData,
    isActive: isActive !== undefined ? isActive : true,
  });

  // Populate category for response
  await product.populate('category', 'name slug image');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

/**
 * Update product (Admin only)
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, sku, price, discount, category, stock, image, images, isActive } = req.body;

  if (sku !== undefined && typeof sku !== 'string') {
    return next(new AppError('SKU must be a string', 400));
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return next(new AppError('Product name must be at least 2 characters long', 400));
  }

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid product ID format', 400));
  }

  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const requestedImages = normalizeRequestedImages(image, images, next);
  if (!requestedImages) return;
  const imageWasProvided = image !== undefined || images !== undefined;
  const oldName = product.name;
  const oldCategory = product.category?.toString?.() || '';
  const oldImage = product.image || product.images?.find(isValidExternalImageUrl) || '';
  const imageWasAutoAssigned = ['pexels', 'category-fallback', 'title-fallback', 'legacy'].includes(product.imageSource) ||
    isLegacyAutoImage(product) || !isValidExternalImageUrl(oldImage);

  // If SKU is being changed, check if new SKU already exists
  if (sku && sku.toUpperCase() !== product.sku) {
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return next(new AppError('A product with this SKU already exists', 409));
    }
  }

  // If category is being changed, validate it exists
  if (category !== undefined && category.toString() !== oldCategory) {
    if (!mongoose.isValidObjectId(category)) {
      return next(new AppError('Invalid category ID format', 400));
    }
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return next(new AppError('Category not found', 404));
    }
  }

  // Update fields
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (sku !== undefined) product.sku = sku.toUpperCase();
  if (price !== undefined) product.price = price;
  if (discount !== undefined) product.discount = discount;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;
  if (isActive !== undefined) product.isActive = isActive;

  const titleOrCategoryChanged = (name !== undefined && product.name !== oldName) ||
    (category !== undefined && category.toString() !== oldCategory);
  if (imageWasProvided && requestedImages.length) {
    setProductImage(product, { image: requestedImages[0], images: requestedImages, imageSource: 'manual' });
  } else if (imageWasProvided || (titleOrCategoryChanged && imageWasAutoAssigned) || !isValidExternalImageUrl(oldImage)) {
    const categoryName = await getCategoryName(product.category);
    setProductImage(product, await productImageService.lookup(product.name, categoryName, {
      excludeImageUrls: await getUsedImageUrls(product._id),
      cacheKeySuffix: product.sku,
    }));
  } else {
    const existingImages = [...new Set((product.images || []).filter(isValidExternalImageUrl))];
    if (isValidExternalImageUrl(product.image) && !existingImages.includes(product.image)) existingImages.unshift(product.image);
    product.images = existingImages;
    product.image = product.image || existingImages[0];
    if (!product.imageSource) product.imageSource = 'manual';
  }

  await product.save();

  // Populate category for response
  await product.populate('category', 'name slug image');

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

/**
 * Delete product (Admin only)
 * Soft delete by setting isActive to false instead of hard delete
 */
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid product ID format', 400));
  }

  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Soft delete: set isActive to false
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deactivated successfully',
    data: null,
  });
});

/**
 * Permanently delete product (Admin only)
 * Hard delete - removes document from database
 * Use with caution - recommended to use soft delete instead
 */
export const hardDeleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid product ID format', 400));
  }

  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  await Product.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Product permanently deleted',
    data: null,
  });
});

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
};
