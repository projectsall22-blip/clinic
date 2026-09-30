const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { changePassword, updateProfilePicture, updateUserInfo } = require('../controllers/userController');

router.put('/change-password',   protect, changePassword);
router.put('/profile-picture',   protect, updateProfilePicture);
router.put('/update-info',       protect, updateUserInfo);

module.exports = router;
