import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { configureDnsServers } from '../config/dns.js';
import User from '../models/User.js';

async function seedAdmin() {
  console.log('=========================================');
  console.log('  T-Kart Initial Admin Setup Seed        ');
  console.log('=========================================');

  const adminName = process.env.ADMIN_NAME || 'Admin User';
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPhone = process.env.ADMIN_PHONE || '9876543210';
  if (!adminEmail || !adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding an administrator.');
  }
  if (adminEmail.includes('replace_with') || adminPassword.toLowerCase().includes('replace_with') || adminPassword.length < 12) {
    throw new Error('Replace the example admin credentials and use an administrator password of at least 12 characters.');
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tkart_db';
  configureDnsServers();
  await mongoose.connect(uri, { tls: true, tlsAllowInvalidCertificates: false });
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  let adminUser = await User.findOne({ email: adminEmail });

  if (adminUser) {
    console.log(` Admin account for '${adminEmail}' already exists.`);
    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(` Updated user role to 'admin'.`);
    } else {
      console.log(` Admin role confirmed.`);
    }
  } else {
    adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      role: 'admin',
    });
    console.log(` Initial Administrator created successfully!`);
  }

  console.log('-----------------------------------------');
  console.log(`  Admin ID:    ${adminUser._id}`);
  console.log(`  Admin Name:  ${adminUser.name}`);
  console.log(`  Admin Email: ${adminUser.email}`);
  console.log(`  Admin Role:  ${adminUser.role}`);
  console.log('=========================================');

  await mongoose.disconnect();
  console.log(' Database disconnected. Admin seed complete.\n');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Error during Admin seed:', err.message);
  process.exit(1);
});
