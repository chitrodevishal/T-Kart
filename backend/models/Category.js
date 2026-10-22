import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      unique: true,
      sparse: true,
    },
    catalogSource: { type: String, trim: true, index: true },
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from category name before validation
categorySchema.pre('validate', function () {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
