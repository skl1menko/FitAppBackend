const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');

const {verifyToken} = require('../middleware/authMiddleware');
const {
    validateEmail,
    validatePassword,
    validateRegistration
} = require('../middleware/validationMiddleware');

//POST /api/auth/register
router.post('/register', validateRegistration, register);

//POST /api/auth/login
router.post('/login', validateEmail, validatePassword, login);

//GET /api/auth/profile
router.get('/profile', verifyToken, getProfile);

//PUT /api/auth/profile
router.put('/profile', verifyToken, updateProfile);

module.exports = router;