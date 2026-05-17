const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const {generateToken} = require('../middleware/authMiddleware');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const UserDTO = require('../dto/user.dto');

//POST /api/auth/register
const register = asyncHandler(async (req, res) => {
    const {email, password, full_name, role} = req.body;

    validateRequired(email, 'Email');
    validateRequired(password, 'Password');
    validateRequired(full_name, 'Full name');

    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
        throw new AppError('Email is already registered', 400);
    }

    const roleName = role || 'athlete';
    const userRole = await Role.getRoleByName(roleName);

    if (!userRole) {
        throw new AppError('Invalid role', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.createUser(email, hashedPassword, full_name, userRole.id);
    const token = generateToken(newUser.id);
    const userWithRole = {...newUser, role_name: userRole.name, full_name: newUser.full_name};
    
    return createResponse(res, UserDTO.toAuth(userWithRole, token),'User registered successfully');
});

//POST /api/auth/login
const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    
    validateRequired(email, 'Email');
    validateRequired(password, 'Password');
    
    const user = await User.findUserByEmail(email);
    if (!user) {
        throw new AppError('Invalid email or password', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 400);
    }

    const token = generateToken(user.id);



    return successResponse(res, UserDTO.toAuth(user, token),'Login successful');
});

//GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
    
    
    const userId = req.user.id;
    
    const user = await User.findUserById(userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return successResponse(res, UserDTO.toProfile(user));
});

//GET /api/auth/users

const getAllUser = asyncHandler(async (req, res) => {
    
    const users = await User.getAllUsers();
    return successResponse(res, UserDTO.toListArray(users));
});

//PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {full_name, avatar_url, image_url} = req.body;
    
    validateRequired(full_name, 'Full name');

    await User.updateUser(userId, full_name, avatar_url !== undefined ? avatar_url : image_url || null);
    const updatedUser = await User.findUserById(userId);
    
    return successResponse(res, UserDTO.toList(updatedUser), 'Profile updated successfully');
});

//POST /api/auth/google/complete-role
const completeGoogleRole = asyncHandler(async (req, res) => {
    const {setup_token, role} = req.body || {};

    validateRequired(setup_token, 'Setup token');
    validateRequired(role, 'Role');

    if (role !== 'athlete' && role !== 'trainer') {
        throw new AppError('Invalid role', 400);
    }

    let payload;
    try {
        payload = jwt.verify(setup_token, process.env.JWT_SECRET);
    } catch {
        throw new AppError('Invalid or expired setup token', 401);
    }

    if (payload?.purpose !== 'google-role-setup') {
        throw new AppError('Invalid setup token purpose', 401);
    }

    const email = payload.email;
    const fullName = payload.fullName || email?.split('@')?.[0] || 'Google User';
    validateRequired(email, 'Email');

    let user = await User.findUserByEmail(email);
    if (!user) {
        const userRole = await Role.getRoleByName(role);
        if (!userRole) {
            throw new AppError('Invalid role', 400);
        }

        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const newUser = await User.createUser(email, hashedPassword, fullName, userRole.id);
        user = await User.findUserById(newUser.id);
    }

    const token = generateToken(user.id);
    return successResponse(res, UserDTO.toAuth(user, token), 'Google sign-in completed successfully');
});

module.exports = {
    register,
    login,
    getProfile,
    getAllUser,
    updateProfile,
    completeGoogleRole
};
