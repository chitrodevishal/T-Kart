import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { processMockPayment, getPaymentByOrderId } from '../controllers/paymentController.js';

const router = express.Router();

/**
 * Simulated payment routes
 * POST /api/payments/mock
 * GET  /api/payments/:orderId
 */
router.use(protect);
router.post('/mock', processMockPayment);
router.get('/:orderId', getPaymentByOrderId);

export default router;
