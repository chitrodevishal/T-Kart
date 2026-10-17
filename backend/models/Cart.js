import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Cart item must reference a product'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cart must belong to an authenticated customer'],
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Instance method to recalculate cart totals on the server
 * Never trust prices or totals passed from browser
 */
cartSchema.methods.recalculateTotals = async function () {
  await this.populate('items.product');

  let subtotal = 0;
  let total = 0;

  // Filter out any deleted or inactive products
  this.items = this.items.filter((item) => item.product && item.product.isActive);

  for (const item of this.items) {
    const originalPrice = item.product.price;
    const finalPrice = item.product.finalPrice ?? originalPrice;

    subtotal += originalPrice * item.quantity;
    total += finalPrice * item.quantity;
  }

  this.subtotal = Math.round(subtotal * 100) / 100;
  this.discountTotal = Math.round((subtotal - total) * 100) / 100;
  this.total = Math.round(total * 100) / 100;

  return this;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
