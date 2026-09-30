const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/adminController');

// Settings (public GET so LandingPage can fetch clinic name without auth)
router.get('/settings', getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

module.exports = router;
