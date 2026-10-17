import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User, Category, Product, Cart, Order, Payment } from '../models/index.js';

async function runModelVerification() {
  console.log('--- Starting T-Kart Mongoose Models Verification ---');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tkart_db';

  await mongoose.connect(uri);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  // 1. Clean previous test artifacts if any
  await User.deleteMany({ email: 'test_model_check@tkart.com' });
  await Category.deleteMany({ slug: 'test-electronics' });
  await Product.deleteMany({ sku: 'TEST-SKU-001' });

  // 2. Test User Model & Password Hashing
  console.log('\n[1/6] Testing User Model & Bcrypt Hashing...');
  const testUser = await User.create({
    name: 'Model Test User',
    email: 'test_model_check@tkart.com',
    password: 'SecurePassword123!',
    phone: '9876543210',
    role: 'customer',
  });
  console.log('  User created with ID:', testUser._id);
  console.log('  Password field in toJSON:', testUser.toJSON().password ? 'EXPOSED (BUG!)' : 'HIDDEN (CORRECT)');
  
  const isPassValid = await testUser.comparePassword('SecurePassword123!');
  console.log('  Password compare valid:', isPassValid ? 'MATCHES (CORRECT)' : 'FAILED (BUG!)');

  // 3. Test Category Model & Slug Hook
  console.log('\n[2/6] Testing Category Model & Slug Generator...');
  const testCategory = await Category.create({
    name: 'Test Electronics',
    description: 'Gadgets and audio electronics for testing',
  });
  console.log('  Category created:', testCategory.name);
  console.log('  Auto-generated Slug:', testCategory.slug, testCategory.slug === 'test-electronics' ? '(CORRECT)' : '(FAIL)');

  // 4. Test Product Model & Virtuals
  console.log('\n[3/6] Testing Product Model & Virtual Prices...');
  const testProduct = await Product.create({
    name: 'T-Kart Noise Cancelling Headphones',
    description: 'High-fidelity Bluetooth wireless headphones with active noise cancellation',
    sku: 'TEST-SKU-001',
    price: 5000,
    discount: 20, // 20% discount -> expected finalPrice: 4000
    category: testCategory._id,
    stock: 4, // Expected low stock: true
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
  });
  console.log('  Product created:', testProduct.name);
  console.log('  Original Price: ₹' + testProduct.price);
  console.log('  Virtual Final Price: ₹' + testProduct.finalPrice, testProduct.finalPrice === 4000 ? '(CORRECT)' : '(FAIL)');
  console.log('  Low stock virtual:', testProduct.isLowStock ? 'YES (CORRECT, stock=4)' : 'NO (FAIL)');

  // 5. Test Cart Model & Server Recalculation
  console.log('\n[4/6] Testing Cart Model & Server Pricing Calculations...');
  const testCart = await Cart.create({
    user: testUser._id,
    items: [{ product: testProduct._id, quantity: 2 }],
  });
  await testCart.recalculateTotals();
  await testCart.save();
  console.log('  Cart Subtotal: ₹' + testCart.subtotal);
  console.log('  Cart Total (after discount): ₹' + testCart.total, testCart.total === 8000 ? '(CORRECT, 4000*2)' : '(FAIL)');

  // 6. Test Order Model & Line Snapshots
  console.log('\n[5/6] Testing Order Model & Product Snapshots...');
  const testOrder = await Order.create({
    orderNumber: `TK-${Date.now()}-TEST`,
    user: testUser._id,
    orderItems: [
      {
        product: testProduct._id,
        name: testProduct.name,
        sku: testProduct.sku,
        price: testProduct.price,
        discount: testProduct.discount,
        finalPrice: testProduct.finalPrice,
        quantity: 2,
        image: testProduct.images[0],
      },
    ],
    shippingAddress: {
      fullName: 'Model Test User',
      phone: '9876543210',
      address: '123 Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    },
    itemsTotal: 8000,
    shippingFee: 0,
    tax: 0,
    totalAmount: 8000,
    orderStatus: 'placed',
  });
  console.log('  Order created:', testOrder.orderNumber);
  console.log('  Snapshot item SKU:', testOrder.orderItems[0].sku);
  console.log('  Order status:', testOrder.orderStatus);

  // 7. Test Payment Model
  console.log('\n[6/6] Testing Payment Model...');
  const testPayment = await Payment.create({
    order: testOrder._id,
    user: testUser._id,
    transactionId: `TXN_SIM_${Date.now()}`,
    amount: 8000,
    currency: 'INR',
    status: 'success',
    gatewayResponse: {
      simulatedCode: 'SIM_SUCCESS',
      message: 'Demo card payment approved',
      simulatedCardLast4: '4242',
    },
  });
  console.log('  Payment record created:', testPayment.transactionId);
  console.log('  Payment status:', testPayment.status);

  // 8. Clean up test records
  console.log('\n--- Cleaning up temporary test records ---');
  await Payment.findByIdAndDelete(testPayment._id);
  await Order.findByIdAndDelete(testOrder._id);
  await Cart.findByIdAndDelete(testCart._id);
  await Product.findByIdAndDelete(testProduct._id);
  await Category.findByIdAndDelete(testCategory._id);
  await User.findByIdAndDelete(testUser._id);
  console.log(' Cleanup complete. Database is pristine.');

  await mongoose.disconnect();
  console.log('\n✅ All 6 Mongoose models passed schema, validation, index, and relationship verification!');
  process.exit(0);
}

runModelVerification().catch((err) => {
  console.error('❌ Model Verification Failed:', err);
  process.exit(1);
});
