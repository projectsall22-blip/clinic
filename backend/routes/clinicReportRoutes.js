const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getReceptionistReport, getPharmaReport,
    getAdminReport, getStockOverview
} = require('../controllers/clinicReportsController');

router.get('/receptionist', protect, authorize('receptionist', 'admin'), getReceptionistReport);
router.get('/pharma', protect, authorize('pharmaceutical', 'admin'), getPharmaReport);
router.get('/admin', protect, authorize('admin'), getAdminReport);
router.get('/stock', protect, authorize('admin'), getStockOverview);

module.exports = router;
