const express = require('express');
const router  = express.Router();
const { adminLogin, receptionistLogin, pharmaceuticalLogin, createFirstAdmin } = require('../controllers/authController');

router.post('/admin-login',          adminLogin);
router.post('/receptionist-login',   receptionistLogin);
router.post('/pharmaceutical-login', pharmaceuticalLogin);
router.post('/create-secret-admin-12345', createFirstAdmin);

module.exports = router;
