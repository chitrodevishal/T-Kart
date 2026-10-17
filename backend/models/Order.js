import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Order item must have a snapshot product name'],
    },
    sku: {
      type: String,
      required: [true, 'Order item must have a snapshot SKU'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
    },
    imageSource: { type: String, default: '' },
    imageCredit: { type: String, default: '' },
    imageCreditUrl: { type: String, default: '' },
    imageSourceUrl: { type: String, default: '' },
    categoryName: { type: String, default: '' },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide recipient full name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide delivery phone number'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide street address'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'Please provide state / province'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Please provide postal code'],
      trim: true,
    },
  },
  { _id: false }
);

const paymentInfoSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      default: 'mock_card',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a customer'],
      index: true,
    },
    orderItems: {
      type: [orderItemSnapshotSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    paymentInfo: {
      type: paymentInfoSchema,
      default: () => ({}),
    },
    orderStatus: {
      type: String,
      enum: {
        values: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
      index: true,
    },
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Prevent duplicate stock restoration on repeated cancellation requests
    isInventoryRestored: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for fast order history querying & admin management
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
