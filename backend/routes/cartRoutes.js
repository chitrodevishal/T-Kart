import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

/**
 * Cart Routes (authenticated customer cart)
 * GET    /api/cart
 * POST   /api/cart/items
 * PATCH  /api/cart/items/:itemId
 * DELETE /api/cart/items/:itemId
 * DELETE /api/cart
 */
router.use(protect);
router.get('/', getCart);
router.post('/items', addCartItem);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
router.delete('/', clearCart);

export default router;
