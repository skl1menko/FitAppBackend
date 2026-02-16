const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    getAllUser,
    updateProfile
} = require('../controllers/authController');

const {verifyToken, generateToken} = require('../middleware/authMiddleware');
const {
    validateEmail,
    validatePassword,
    validateRegistration
} = require('../middleware/validationMiddleware');

const passport = require('../config/passport');

//POST /api/auth/register
router.post('/register', validateRegistration, register);

//POST /api/auth/login
router.post('/login', validateEmail, validatePassword, login);

//GET /api/auth/profile
router.get('/profile', verifyToken, getProfile);

router.get('/users', verifyToken, getAllUser);

//PUT /api/auth/profile
router.put('/profile', verifyToken, updateProfile);

router.get('/google' , passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', passport.authenticate('google', 
    { session: false, failureRedirect: `${process.env.FRONTEND_URL}`}),
    (req, res) => {
        const token = generateToken(req.user.id);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
    }
);
   

module.exports = router;