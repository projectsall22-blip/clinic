const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    addMedicine, getMedicines, searchMedicines,
    updateMedicine, addStock, deleteMedicine, getStockSummary
} = require('../controllers/medicineController');

router.get('/stock-summary', protect, authorize('pharmaceutical'), getStockSummary);
router.get('/search', protect, authorize('pharmaceutical'), searchMedicines);
router.get('/', protect, authorize('pharmaceutical', 'admin'), getMedicines);
router.post('/', protect, authorize('pharmaceutical'), addMedicine);
router.put('/:id/add-stock', protect, authorize('pharmaceutical', 'admin'), addStock);
router.put('/:id', protect, authorize('pharmaceutical', 'admin'), updateMedicine);
router.delete('/:id', protect, authorize('pharmaceutical', 'admin'), deleteMedicine);

module.exports = router;
