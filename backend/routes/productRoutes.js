import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, optionalProtect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Product Routes
 * Public GET endpoints, protected admin POST/PUT/DELETE endpoints
 */

// GET /api/products - Get all products with search, filtering, sorting, pagination
router.get('/', optionalProtect, getAllProducts);

// GET /api/products/:id - Get single product by ID
router.get('/:id', optionalProtect, getProductById);

// POST /api/products - Create new product (admin only)
router.post('/', protect, adminOnly, createProduct);

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', protect, adminOnly, updateProduct);

// DELETE /api/products/:id - Soft delete product (admin only)
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
