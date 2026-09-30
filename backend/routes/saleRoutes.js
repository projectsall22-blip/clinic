const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createSale, getSales, getSaleById, getSaleDashboardSummary } = require('../controllers/saleController');

router.get('/dashboard-summary', protect, authorize('pharmaceutical'), getSaleDashboardSummary);
router.post('/', protect, authorize('pharmaceutical'), createSale);
router.get('/', protect, authorize('pharmaceutical', 'admin'), getSales);
router.get('/:id', protect, authorize('pharmaceutical', 'admin'), getSaleById);

module.exports = router;
