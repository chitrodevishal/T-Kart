import express from 'express';

const router = express.Router();

/**
 * Cart Routes Placeholder (Full implementation in Phase 7)
 * GET    /api/cart
 * POST   /api/cart/items
 * PATCH  /api/cart/items/:itemId
 * DELETE /api/cart/items/:itemId
 * DELETE /api/cart
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cart module active. Implementation arriving in Phase 7.',
    data: { items: [], subtotal: 0, total: 0 },
  });
});

export default router;
