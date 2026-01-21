const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

//POST /api/auth/register
const register = async (req, res) => {
    try{
        const {email, password, full_name, role} = req.body;

        const existingUser = await User.findUserByEmail(email);
        if(existingUser){
            return  res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const roleName = role || 'athlete';
        const userRole = await Role.findRoleByName(roleName);

        if(!userRole){
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.createUser(email, hashedPassword, full_name, userRole.id);

        const tokenPayload = jwt.sign(
            {userId: newUser.id},
            process.env.JWT_SECRET,
            {expiresIn: '30d'}
        );
        
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data:{
                userId: newUser.id,
                email: email,
                fullName: full_name,
                role: userRole.name,
                token: tokenPayload
            }
        });

    } catch(err){
        console.error('Registration error:', err);
        return res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: err.message
        });
    }
};

//POST /api/auth/login
const login = async (req, res) => {
    try{
        const {email, password} = req.body;
        
        const user = await User.findUserByEmail(email);
        if(!user){
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if(!isPasswordValid){
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const tokenPayload = jwt.sign(
            {userId: user.id},
            process.env.JWT_SECRET,
            {expiresIn: '30d'}
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data:{
                userId: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role_name,
                token: tokenPayload
            }
        });
    } catch(err){
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error: err.message
        });
    }
};

//GET /api/auth/profile
const getProfile = async (req, res) =>{
    try{
        const userId = req.user.id;

        const user = await User.findUserById(userId);

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data:{
                userId: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role_name,
                created_at: user.created_at
            }
        });

    } catch(err){
        console.error('Get profile error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: err.message
        });
    }
};

//PUT /api/auth/profile
const updateProfile = async (req, res) =>{
    try{
        const userId = req.user.id;
        const {full_name} = req.body;
        
        if(!full_name|| full_name.trim() ===''){
            return res.status(400).json({
                success: false,
                message: 'Full name is required'
            });
        }
        await User.updateUser(userId, full_name);
        const updatedUser = await User.findUserById(userId);
        
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data:{
                userId: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.full_name,
                role: updatedUser.role_name
            }
        });
    } catch(err){
        console.error('Update profile error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: err.message
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};

