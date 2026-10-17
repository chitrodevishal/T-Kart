import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import AppError from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const processMockPayment = asyncHandler(async (req, res, next) => {
  const { orderId, outcome } = req.body;
  if (!mongoose.isValidObjectId(orderId)) return next(new AppError('A valid orderId is required', 400));
  if (!['success', 'failed'].includes(outcome)) {
    return next(new AppError('outcome must be success or failed', 400));
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return next(new AppError('Order not found', 404));
  if (order.paymentInfo.status === 'paid') return next(new AppError('Order has already been paid', 409));
  if (!['pending', 'failed'].includes(order.paymentInfo.status)) {
    return next(new AppError('Payment is already being processed', 409));
  }
  if (['cancelled', 'delivered'].includes(order.orderStatus)) {
    return next(new AppError('This order is not eligible for payment', 409));
  }

  const previousPaymentStatus = order.paymentInfo.status;
  const claim = await Order.findOneAndUpdate(
    { _id: order._id, user: req.user._id, orderStatus: { $nin: ['cancelled', 'delivered'] }, 'paymentInfo.status': previousPaymentStatus },
    { $set: { 'paymentInfo.status': 'processing' } },
    { returnDocument: 'after' }
  );
  if (!claim) return next(new AppError('Payment state changed concurrently; reload and retry', 409));

  const transactionId = `MOCK-${Date.now()}-${randomUUID().slice(0, 8)}`.toUpperCase();
  let payment;
  try {
    payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      transactionId,
      amount: order.totalAmount,
      currency: 'INR',
      status: outcome,
      paymentMethod: 'mock_card',
      gatewayResponse: {
        simulatedCode: outcome === 'success' ? 'SIM_APPROVED' : 'SIM_DECLINED',
        message: outcome === 'success' ? 'Simulated payment approved' : 'Simulated payment declined',
        simulatedCardLast4: '4242',
        processedAt: new Date(),
      },
    });
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, user: req.user._id, orderStatus: { $nin: ['cancelled', 'delivered'] }, 'paymentInfo.status': 'processing' },
      {
        $set: {
          'paymentInfo.status': outcome === 'success' ? 'paid' : 'failed',
          'paymentInfo.transactionId': transactionId,
          'paymentInfo.paidAt': outcome === 'success' ? payment.gatewayResponse.processedAt : null,
        },
      },
      { returnDocument: 'after' }
    );
    if (!updatedOrder) throw new Error('Could not finalize simulated payment state');
    const statusCode = outcome === 'success' ? 200 : 402;
    return res.status(statusCode).json({
      success: outcome === 'success',
      message: outcome === 'success' ? 'Simulated payment successful' : 'Simulated payment failed',
      data: { payment, order: updatedOrder },
    });
  } catch (error) {
    if (payment) await Payment.deleteOne({ _id: payment._id });
    await Order.updateOne(
      { _id: order._id, 'paymentInfo.status': 'processing' },
      { $set: { 'paymentInfo.status': previousPaymentStatus, 'paymentInfo.transactionId': order.paymentInfo.transactionId, 'paymentInfo.paidAt': order.paymentInfo.paidAt } }
    );
    throw error;
  }
});

export const getPaymentByOrderId = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  if (!mongoose.isValidObjectId(orderId)) return next(new AppError('Invalid order ID format', 400));
  const orderFilter = { _id: orderId };
  if (req.user.role !== 'admin') orderFilter.user = req.user._id;
  const order = await Order.findOne(orderFilter);
  if (!order) return next(new AppError('Order not found', 404));

  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 });
  if (!payment) return next(new AppError('No payment attempt found for this order', 404));
  res.status(200).json({ success: true, data: payment });
});

export default { processMockPayment, getPaymentByOrderId };
