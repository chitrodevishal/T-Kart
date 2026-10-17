import mongoose from 'mongoose';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [120, 'Product name cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      trim: true,
      maxlength: [2000, 'Product description cannot exceed 2000 characters'],
    },
    sku: {
      type: String,
      required: [true, 'Please provide a unique product SKU'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Please specify product price'],
      min: [0, 'Product price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [90, 'Discount percentage cannot exceed 90%'],
      enum: {
        values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
        message: 'Discount must be 0% or a multiple of 10% up to 90%',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide inventory stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || isValidExternalImageUrl(value),
        message: 'Product image must be an external HTTPS URL',
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0 && v.every(isValidExternalImageUrl);
        },
        message: 'Product must have one or more external HTTPS image URLs',
      },
      default: [],
    },
    imageSource: {
      type: String,
      trim: true,
      default: 'manual',
    },
    imageCredit: { type: String, trim: true, default: '' },
    imageCreditUrl: {
      type: String,
      trim: true,
      default: '',
      validate: { validator: (value) => !value || isValidExternalImageUrl(value), message: 'Image credit must be an external HTTPS URL' },
    },
    imageSourceUrl: {
      type: String,
      trim: true,
      default: '',
      validate: { validator: (value) => !value || isValidExternalImageUrl(value), message: 'Image source must be an external HTTPS URL' },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: [0, 'Ratings count cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.pre('validate', function syncPrimaryImage() {
  if (this.image) {
    const primary = this.image.trim();
    this.image = primary;
    this.images = [primary, ...(this.images || []).filter((url) => url !== primary)];
  } else if (this.images?.length) {
    this.image = this.images[0];
  }
});

// Virtual: Server-calculated final price after discount
productSchema.virtual('finalPrice').get(function () {
  if (this.price === undefined || this.price === null) return 0;
  if (!this.discount || this.discount <= 0) return this.price;
  const discounted = this.price * (1 - this.discount / 100);
  return Math.round(discounted * 100) / 100;
});

// Virtual: Low stock indicator (5 or fewer units remaining)
productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= 5;
});

// Virtual: Out of stock indicator
productSchema.virtual('isOutOfStock').get(function () {
  return this.stock <= 0;
});

// Compound indexes for full-text search, filtering, and sorting
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
