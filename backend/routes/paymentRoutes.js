import express from 'express';

const router = express.Router();

/**
 * Payment Routes Placeholder (Full implementation in Phase 8)
 * POST /api/payments/mock
 * GET  /api/payments/:orderId
 */
router.get('/:orderId', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment module active. Implementation arriving in Phase 8.',
  });
});

export default router;
