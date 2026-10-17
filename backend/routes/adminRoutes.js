import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getDashboard, getCustomers, updateCustomerStatus } from '../controllers/adminController.js';
import { getInventory, updateProductStock } from '../controllers/inventoryController.js';
import { getAdminOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.patch('/customers/:id/status', updateCustomerStatus);
router.get('/inventory', getInventory);
router.patch('/products/:id/stock', updateProductStock);
router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
