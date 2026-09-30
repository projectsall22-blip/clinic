const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    addReceptionist, getAllReceptionists, updateReceptionist,
    deactivateReceptionist, resetReceptionistPassword,
    addPharmaceutical, getAllPharmaceuticals, updatePharmaceutical,
    deactivatePharmaceutical, resetPharmaceuticalPassword
} = require('../controllers/staffController');

// ─── Receptionist routes ─────────────────────────────────────────────────────
router.get('/receptionists', protect, authorize('admin'), getAllReceptionists);
router.post('/receptionists', protect, authorize('admin'), addReceptionist);
router.put('/receptionists/:id', protect, authorize('admin'), updateReceptionist);
router.delete('/receptionists/:id', protect, authorize('admin'), deactivateReceptionist);
router.put('/receptionists/:id/reset-password', protect, authorize('admin'), resetReceptionistPassword);

// ─── Pharmaceutical routes ────────────────────────────────────────────────────
router.get('/pharmaceuticals', protect, authorize('admin'), getAllPharmaceuticals);
router.post('/pharmaceuticals', protect, authorize('admin'), addPharmaceutical);
router.put('/pharmaceuticals/:id', protect, authorize('admin'), updatePharmaceutical);
router.delete('/pharmaceuticals/:id', protect, authorize('admin'), deactivatePharmaceutical);
router.put('/pharmaceuticals/:id/reset-password', protect, authorize('admin'), resetPharmaceuticalPassword);

module.exports = router;
