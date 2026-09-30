const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { registerPatient, getPatients, getPatientById, updatePatient } = require('../controllers/patientController');

router.post('/',    protect, authorize('receptionist'),                           registerPatient);
router.get('/',     protect, authorize('receptionist', 'pharmaceutical', 'admin'), getPatients);
router.get('/:id',  protect, authorize('receptionist', 'pharmaceutical', 'admin'), getPatientById);
router.put('/:id',  protect, authorize('receptionist', 'admin'),                  updatePatient);

module.exports = router;
