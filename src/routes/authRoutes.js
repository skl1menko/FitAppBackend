const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    getAllUser,
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

router.get('/users', verifyToken, getAllUser);

//PUT /api/auth/profile
router.put('/profile', verifyToken, updateProfile);

module.exports = router;