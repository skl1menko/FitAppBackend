const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    getAllUser,
    updateProfile,
    completeGoogleRole
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
router.post('/google/complete-role', completeGoogleRole);

router.get('/google', (req, res, next) => {
    const requestedRole = req.query.role;
    const role = requestedRole === 'trainer' || requestedRole === 'athlete'
        ? requestedRole
        : '';

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: role || undefined
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', {session: false}, (err, user, info) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (err) {
            const message = encodeURIComponent(err.message || 'google_auth_failed');
            return res.redirect(`${frontendUrl}/auth/callback?error=${message}`);
        }

        if (!user && info?.code === 'ROLE_REQUIRED') {
            const setupToken = generateToken(
                {
                    purpose: 'google-role-setup',
                    email: info.email,
                    fullName: info.fullName || ''
                },
                '10m'
            );
            const email = encodeURIComponent(info.email || '');
            const fullName = encodeURIComponent(info.fullName || '');
            return res.redirect(`${frontendUrl}/auth/callback?role_required=1&setup_token=${encodeURIComponent(setupToken)}&email=${email}&full_name=${fullName}`);
        }

        if (!user) {
            return res.redirect(`${frontendUrl}/auth/callback?error=google_auth_failed`);
        }

        const token = generateToken(user.id);
        return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    })(req, res, next);
});
   

module.exports = router;
