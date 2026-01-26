const bcrypt = require('bcrypt');
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
    const {full_name} = req.body;
    
    validateRequired(full_name, 'Full name');
    
    await User.updateUser(userId, full_name);
    const updatedUser = await User.findUserById(userId);
    
    return successResponse(res, UserDTO.toList(updatedUser), 'Profile updated successfully');
});

module.exports = {
    register,
    login,
    getProfile,
    getAllUser,
    updateProfile
};

