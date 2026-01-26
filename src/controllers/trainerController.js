const User = require('../models/User');
const Workout = require('../models/Workout');
const BodyMeasurement = require('../models/BodyMeasurement');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {successResponse, createResponse} = require('../utils/responseHandler');

//GET /api/trainer/clients
const getClients = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client list', 403);
    }
    
    const clients = await User.getTrainerClients(trainerId);
    return successResponse(res, clients);
});

//POST /api/trainer/clients
const addClient = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {email} = req.body;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can assign clients', 403);
    }

    validateRequired(email, 'Client email');

    const client = await User.findUserByEmail(email);
    if (!client) {
        throw new AppError('Client not found', 404);
    }

    if (client.role_name !== 'athlete') {
        throw new AppError('Only athletes can be assigned as clients', 400);
    }

    if (client.id === trainerId) {
        throw new AppError('Trainers cannot assign themselves as clients', 400);
    }

    const existingClients = await User.getTrainerClients(trainerId);
    const alreadyAssigned = existingClients.find(c => c.id === client.id);
    if (alreadyAssigned) {
        throw new AppError('Client is already assigned to you', 400);
    }
    
    await User.assignClientToTrainer(client.id, trainerId);
    return createResponse(res, {
        client_id: client.id,
        client_name: client.full_name,
        client_email: client.email
    }, 'Client successfully assigned');
});

//DELETE /api/trainer/clients/:clientId
const removeClient = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can remove clients', 403);
    }
    
    const client = await User.findUserById(clientId);
    if (!client) {
        throw new AppError('Client not found', 404);
    }

    const clients = await User.getTrainerClients(trainerId);
    const isMyClient = clients.find(c => c.id === parseInt(clientId));
    if (!isMyClient) {
        throw new AppError('This client is not assigned to you', 400);
    }

    await User.removeClientFromTrainer(clientId, trainerId);
    return createResponse(res, {
        client_id: client.id,
        client_name: client.full_name,
        client_email: client.email
    }, 'Client successfully removed');
});

//GET /api/trainer/clients/:clientId/workouts
const getClientWorkouts = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client workouts', 403);
    }

    const clients = await User.getTrainerClients(trainerId);
    const isMyClient = clients.find(c => c.id === parseInt(clientId));
    if (!isMyClient) {
        throw new AppError('This client is not assigned to you', 400);
    }

    const workouts = await Workout.getUserWorkouts(clientId);
    return successResponse(res, {
        client: {
            id: isMyClient.id,
            full_name: isMyClient.full_name,
            email: isMyClient.email
        },
        workouts: workouts
    });
});

//GET /api/trainer/clients/:clientId/body-measurements
const getClientBodyMeasurements = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client body measurements', 403);
    }
    
    const clients = await User.getTrainerClients(trainerId);
    const isMyClient = clients.find(c => c.id === parseInt(clientId));
    if (!isMyClient) {
        throw new AppError('This client is not assigned to you', 400);
    }

    const workouts = await Workout.getUserWorkouts(clientId);
    const latestMeasurement = await BodyMeasurement.getLatestMeasurement(clientId);

    const totalWorkouts = workouts.length;
    const totalTonnage = workouts.reduce((sum, w) => sum + (parseFloat(w.total_tonnage) || 0), 0);
    const recentWorkouts = workouts.slice(0, 5);

    return successResponse(res, {
        client: {
            id: isMyClient.id,
            full_name: isMyClient.full_name,
            email: isMyClient.email
        },
        statistics: {
            total_workouts: totalWorkouts,
            total_tonnage: totalTonnage,
            avg_tonnage_per_workout: totalWorkouts > 0 ? (totalTonnage / totalWorkouts).toFixed(2) : 0
        },
        latest_body_measurement: latestMeasurement || null,
        recent_workouts: recentWorkouts
    });
});

module.exports = {
    getClients,
    addClient,
    removeClient,
    getClientWorkouts,
    getClientBodyMeasurements
};