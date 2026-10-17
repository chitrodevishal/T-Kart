import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';

const router = express.Router();

/**
 * Customer-owned order routes
 * POST   /api/orders
 * GET    /api/orders/my-orders
 * GET    /api/orders/:id
 */
router.use(protect);
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

export default router;
