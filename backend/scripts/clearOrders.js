import 'dotenv/config';
import mongoose from 'mongoose';
import { configureDnsServers } from '../config/dns.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

const confirmation = '--confirm=clear-all-orders';

async function clearOrders() {
  if (!process.argv.includes(confirmation)) {
    throw new Error(`Refusing to delete orders without ${confirmation}`);
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  configureDnsServers();
  await mongoose.connect(process.env.MONGO_URI);
  if (mongoose.connection.name !== 'tkart_db') {
    throw new Error(`Refusing to clear orders from unexpected database: ${mongoose.connection.name}`);
  }

  const orderIds = await Order.distinct('_id');
  const removedPayments = orderIds.length
    ? await Payment.deleteMany({ order: { $in: orderIds } })
    : { deletedCount: 0 };
  const removedOrders = orderIds.length
    ? await Order.deleteMany({ _id: { $in: orderIds } })
    : { deletedCount: 0 };

  console.log(`Cleared ${removedOrders.deletedCount} orders and ${removedPayments.deletedCount} linked mock payments from ${mongoose.connection.name}.`);
}

clearOrders()
  .catch((error) => {
    console.error(`Order cleanup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
