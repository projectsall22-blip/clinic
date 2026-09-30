const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    bookAppointment, getAppointments, getAppointmentById,
    updateAppointment, getDashboardSummary, getSlipData, getAppointmentByToken
} = require('../controllers/appointmentController');

router.get('/dashboard-summary', protect, authorize('receptionist'), getDashboardSummary);
router.post('/', protect, authorize('receptionist'), bookAppointment);
router.get('/by-token/:tokenNumber', protect, authorize('pharmaceutical', 'receptionist', 'admin'), getAppointmentByToken);
router.get('/', protect, authorize('receptionist', 'admin'), getAppointments);
router.get('/:id/slip', protect, authorize('receptionist', 'admin'), getSlipData);
router.get('/:id', protect, authorize('receptionist', 'admin'), getAppointmentById);
router.put('/:id', protect, authorize('receptionist', 'admin'), updateAppointment);

module.exports = router;
