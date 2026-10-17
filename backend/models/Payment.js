import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Payment must be associated with an order'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a customer'],
      index: true,
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction reference is required'],
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: ['success', 'failed'],
        message: '{VALUE} is not a valid payment outcome',
      },
      required: [true, 'Payment status is required'],
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'mock_card',
    },
    gatewayResponse: {
      simulatedCode: {
        type: String,
        default: 'SIM_OK',
      },
      message: {
        type: String,
        default: 'Simulated payment transaction completed',
      },
      simulatedCardLast4: {
        type: String,
        default: '4242',
      },
      processedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for verifying customer payment history
paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
