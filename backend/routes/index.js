import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import adminRoutes from './adminRoutes.js';
import AppError from '../utils/appError.js';

const router = express.Router();

/**
 * System Health Check Endpoint
 * Returns comprehensive API and Database operational metrics
 */
router.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  const dbStatus = dbStates[stateCode] || 'unknown';

  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    message: 'T-Kart REST API is running healthy',
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memoryUsageMB: {
        rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
    },
    database: {
      status: dbStatus,
      connected: stateCode === 1,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
  });
});

/**
 * Diagnostic Error Simulation Route (Used to test centralized error handling)
 */
router.get('/error-test', (req, res, next) => {
  const type = req.query.type;

  if (type === 'operational') {
    return next(new AppError('Simulated 400 Bad Request operational error', 400));
  }
  if (type === 'notfound') {
    return next(new AppError('Simulated 404 Resource Not Found', 404));
  }
  if (type === 'unauthorized') {
    return next(new AppError('Simulated 401 Unauthorized access attempt', 401));
  }
  if (type === 'forbidden') {
    return next(new AppError('Simulated 403 Forbidden access attempt', 403));
  }

  // Simulating an unhandled crash to test 500 handler
  throw new Error('Simulated unexpected 500 internal server exception');
});

// Resource Routes Mounting
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
