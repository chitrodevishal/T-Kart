import mongoose from 'mongoose';

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
      max: [100, 'Discount percentage cannot exceed 100%'],
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
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Product must have at least one image URL',
      },
      default: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      ],
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
