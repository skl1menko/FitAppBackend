const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId, expiresIn = '30d') => {
    return jwt.sign(
        {userId},
        process.env.JWT_SECRET,
        {expiresIn}
    );
};

const verifyToken = async (req, res, next) => {
    try{
        console.log('🔐 verifyToken middleware called');
        const authHeader = req.headers.authorization;
        console.log('authHeader:', authHeader);

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        console.log('token extracted:', token.substring(0, 20) + '...');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded token:', decoded);
        
        const user = await User.findUserById(decoded.userId);
        console.log('user found:', user);

        if(!user){
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                message: 'User not found'
            })
        }

        req.user = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role_name
        };
        next();
    } catch(err){
        if(err.name ==='JsonWebTokenError'){
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: err.message
        });
    }
};

module.exports = {generateToken, verifyToken};