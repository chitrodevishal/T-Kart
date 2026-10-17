import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, optionalProtect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Category Routes
 * Public GET endpoints, protected admin POST/PUT/DELETE endpoints
 */

// GET /api/categories - Get all categories
router.get('/', optionalProtect, getAllCategories);

// GET /api/categories/slug/:slug - Get category by slug (must come before :id)
router.get('/slug/:slug', optionalProtect, getCategoryBySlug);

// GET /api/categories/:id - Get single category by ID
router.get('/:id', optionalProtect, getCategoryById);

// POST /api/categories - Create new category (admin only)
router.post('/', protect, adminOnly, createCategory);

// PUT /api/categories/:id - Update category (admin only)
router.put('/:id', protect, adminOnly, updateCategory);

// DELETE /api/categories/:id - Soft delete category (admin only)
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
