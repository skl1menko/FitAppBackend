const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findUserById(decoded.userId);

        if(!user){
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

module.exports = {verifyToken};