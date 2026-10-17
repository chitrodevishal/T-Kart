import dotenv from 'dotenv';
dotenv.config();

import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { configureDnsServers } from '../config/dns.js';
import { User, Category, Product, Cart, Order, Payment } from '../models/index.js';

async function runModelVerification() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tkart_db';
  const suffix = randomUUID().replaceAll('-', '');
  const categoryName = `Model Check ${suffix.slice(0, 8)}`;
  const records = { payment: null, order: null, cart: null, product: null, category: null, user: null };

  configureDnsServers();
  await mongoose.connect(uri);
  console.log('--- Verifying T-Kart Mongoose models ---');
  console.log('Connected to MongoDB:', mongoose.connection.name);

  try {
    records.user = await User.create({
      name: 'Model Check User',
      email: `model-check-${suffix}@example.invalid`,
      password: 'SecurePassword123!',
      phone: '9876543210',
      role: 'customer',
    });
    assert.equal(records.user.toJSON().password, undefined, 'serialized users must not expose passwords');
    assert.equal(await records.user.comparePassword('SecurePassword123!'), true, 'password hashing must be reversible through comparison');
    console.log('User hashing and safe serialization: passed');

    records.category = await Category.create({ name: categoryName, description: 'Temporary model verification category' });
    assert.equal(records.category.slug, categoryName.toLowerCase().replaceAll(' ', '-'), 'category slug hook must normalize names');
    console.log('Category slug generation: passed');

    records.product = await Product.create({
      name: `Model Check Headphones ${suffix.slice(0, 8)}`,
      description: 'Temporary model verification product',
      sku: `MC-${suffix.slice(0, 16)}`,
      price: 5000,
      discount: 20,
      category: records.category._id,
      stock: 4,
      images: ['https://example.invalid/model-check.jpg'],
    });
    assert.equal(records.product.finalPrice, 4000, 'discounted virtual price must be calculated');
    assert.equal(records.product.isLowStock, true, 'low-stock virtual must reflect stock of four');
    console.log('Product validation and virtual fields: passed');

    records.cart = await Cart.create({ user: records.user._id, items: [{ product: records.product._id, quantity: 2 }] });
    await records.cart.recalculateTotals();
    await records.cart.save();
    assert.equal(records.cart.total, 8000, 'cart total must use discounted server price');
    console.log('Cart totals: passed');

    records.order = await Order.create({
      orderNumber: `TK-${Date.now()}-${suffix.slice(0, 8)}`,
      user: records.user._id,
      orderItems: [{ product: records.product._id, name: records.product.name, sku: records.product.sku, price: records.product.price, discount: records.product.discount, finalPrice: records.product.finalPrice, quantity: 2, image: records.product.images[0] }],
      shippingAddress: { fullName: 'Model Check User', phone: '9876543210', address: '123 Model Test Street', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' },
      itemsTotal: 8000,
      totalAmount: 8000,
    });
    assert.equal(records.order.orderItems[0].sku, records.product.sku, 'order must preserve product snapshot data');
    console.log('Order snapshots and validation: passed');

    records.payment = await Payment.create({
      order: records.order._id,
      user: records.user._id,
      transactionId: `TXN_MC_${suffix}`,
      amount: 8000,
      currency: 'INR',
      status: 'success',
      gatewayResponse: { simulatedCode: 'SIM_SUCCESS', message: 'Model verification', simulatedCardLast4: '4242' },
    });
    assert.equal(records.payment.status, 'success');
    console.log('Payment validation: passed');
  } finally {
    const cleanupResults = await Promise.allSettled(
      [['payment', Payment], ['order', Order], ['cart', Cart], ['product', Product], ['category', Category], ['user', User]]
        .filter(([key]) => records[key]?._id)
        .map(([key, Model]) => Model.deleteOne({ _id: records[key]._id }))
    );
    await mongoose.disconnect();
    const cleanupError = cleanupResults.find((result) => result.status === 'rejected');
    if (cleanupError) throw cleanupError.reason;
    console.log('Temporary model verification records cleaned up.');
  }
}

runModelVerification().catch((error) => {
  console.error('Model verification failed:', error.message);
  process.exitCode = 1;
});
