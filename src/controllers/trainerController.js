const User = require('../models/User');
const Workout = require('../models/Workout');
const BodyMeasurement = require('../models/BodyMeasurement');
const HealthMetrics = require('../models/HealthMetrics');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {successResponse, createResponse} = require('../utils/responseHandler');
const TrainerDTO = require('../dto/trainer.dto');
const BodyMeasurementDTO = require('../dto/bodyMeasurements.dto');
const HealthMetricsDTO = require('../dto/healthMetrics.dto');

const verifyTrainerClientRelation = async (trainerId, clientId) => {
    const clients = await User.getTrainerClients(trainerId);
    const myClient = clients.find((client) => client.id === parseInt(clientId));
    if (!myClient) {
        throw new AppError('This client is not assigned to you', 400);
    }
    return myClient;
};

const createConnectionRequest = async ({athleteId, trainerId, requestedById}) => {
    const athlete = await User.findUserById(athleteId);
    if (!athlete) {
        throw new AppError('Athlete not found', 404);
    }
    if (athlete.role_name !== 'athlete') {
        throw new AppError('Only athletes can be assigned as clients', 400);
    }

    const trainer = await User.findUserById(trainerId);
    if (!trainer) {
        throw new AppError('Trainer not found', 404);
    }
    if (trainer.role_name !== 'trainer') {
        throw new AppError('Selected user is not a trainer', 400);
    }

    if (Number(athlete.id) === Number(trainer.id)) {
        throw new AppError('Trainer and athlete cannot be the same user', 400);
    }

    const existingLink = await User.getTrainerClientLinkByAthleteId(athlete.id);
    if (existingLink) {
        if (existingLink.status === 'accepted') {
            if (Number(existingLink.trainer_id) === Number(trainer.id)) {
                throw new AppError('Athlete is already connected with this trainer', 400);
            }
            throw new AppError('Athlete is already connected with another trainer', 400);
        }

        if (existingLink.status === 'pending') {
            if (Number(existingLink.trainer_id) !== Number(trainer.id)) {
                throw new AppError('Athlete already has a pending request with another trainer', 400);
            }

            if (Number(existingLink.requested_by_id) === Number(requestedById)) {
                throw new AppError('Request is already pending', 400);
            }

            throw new AppError('A request is already pending and waiting for your response', 400);
        }
    }

    const request = await User.createPendingTrainerClientRequest(athlete.id, trainer.id, requestedById);
    if (!request) {
        throw new AppError('Failed to create request', 400);
    }

    return {athlete, trainer};
};

//GET /api/trainer/clients
const getClients = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client list', 403);
    }
    
    const clients = await User.getTrainerClients(trainerId);
    return successResponse(res, TrainerDTO.toClientList(clients));
});

//POST /api/trainer/clients
const addClient = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {email, clientId, athleteId} = req.body;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can assign clients', 403);
    }

    const targetClientId = clientId || athleteId;
    if (!email && !targetClientId) {
        throw new AppError('Client email or client ID is required', 400);
    }

    const client = email
        ? await User.findUserByEmail(email)
        : await User.findUserById(targetClientId);

    if (!client) {
        throw new AppError('Client not found', 404);
    }

    const {athlete} = await createConnectionRequest({
        athleteId: client.id,
        trainerId,
        requestedById: trainerId
    });

    return createResponse(res, TrainerDTO.toClientAction(athlete), 'Request sent to athlete');
});

//GET /api/trainers/athletes/search
const searchAthletes = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const query = typeof req.query.q === 'string' ? req.query.q : '';

    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can search athletes', 403);
    }

    const athletes = await User.searchAthletesForTrainer(query);
    return successResponse(res, TrainerDTO.toAthleteSearchList(athletes, trainerId));
});

//GET /api/trainers/search
const searchTrainers = asyncHandler(async (req, res) => {
    const userRole = req.user.role;
    const query = typeof req.query.q === 'string' ? req.query.q : '';

    if (userRole !== 'athlete') {
        throw new AppError('Only athletes can search trainers', 403);
    }

    const trainers = await User.searchTrainers(query);
    return successResponse(res, TrainerDTO.toTrainerList(trainers));
});

//GET /api/trainers/my-trainer
const getMyTrainer = asyncHandler(async (req, res) => {
    const athleteId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'athlete') {
        throw new AppError('Only athletes can view assigned trainer', 403);
    }

    const trainer = await User.getAthleteTrainer(athleteId);
    return successResponse(res, TrainerDTO.toTrainerInfo(trainer));
});

//DELETE /api/trainers/my-trainer
const unlinkMyTrainer = asyncHandler(async (req, res) => {
    const athleteId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'athlete') {
        throw new AppError('Only athletes can unlink trainer', 403);
    }

    const trainer = await User.getAthleteTrainer(athleteId);
    if (!trainer) {
        throw new AppError('You do not have an assigned trainer', 400);
    }

    await User.removeClientFromTrainer(athleteId, trainer.id);
    return successResponse(res, TrainerDTO.toTrainerInfo(trainer), 'Trainer unlinked successfully');
});

//POST /api/trainers/select
const selectTrainer = asyncHandler(async (req, res) => {
    const athleteId = req.user.id;
    const userRole = req.user.role;
    const {trainerId} = req.body;

    if (userRole !== 'athlete') {
        throw new AppError('Only athletes can select a trainer', 403);
    }

    validateRequired(trainerId, 'Trainer ID');

    const {trainer} = await createConnectionRequest({
        athleteId,
        trainerId,
        requestedById: athleteId
    });

    return createResponse(res, TrainerDTO.toTrainerInfo(trainer), 'Request sent to trainer');
});

//GET /api/trainers/requests/incoming
const getIncomingRequests = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== 'athlete' && role !== 'trainer') {
        throw new AppError('Only athletes and trainers can view requests', 403);
    }

    const requests = await User.getIncomingTrainerClientRequests(userId, role);
    return successResponse(res, TrainerDTO.toConnectionRequestList(requests));
});

//GET /api/trainers/requests/outgoing
const getOutgoingRequests = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== 'athlete' && role !== 'trainer') {
        throw new AppError('Only athletes and trainers can view requests', 403);
    }

    const requests = await User.getOutgoingTrainerClientRequests(userId);
    return successResponse(res, TrainerDTO.toConnectionRequestList(requests));
});

//POST /api/trainers/requests/:athleteId/:trainerId/approve
const approveRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const {athleteId, trainerId} = req.params;

    if (role !== 'athlete' && role !== 'trainer') {
        throw new AppError('Only athletes and trainers can approve requests', 403);
    }

    const request = await User.getPendingTrainerClientRequest(athleteId, trainerId);
    if (!request) {
        throw new AppError('Request not found', 404);
    }

    const isRecipient = (role === 'athlete' && Number(request.athlete_id) === Number(userId))
        || (role === 'trainer' && Number(request.trainer_id) === Number(userId));
    if (!isRecipient) {
        throw new AppError('You cannot approve this request', 403);
    }

    if (Number(request.requested_by_id) === Number(userId)) {
        throw new AppError('You cannot approve your own request', 400);
    }

    const currentTrainer = await User.getAthleteTrainer(request.athlete_id);
    if (currentTrainer && Number(currentTrainer.id) !== Number(request.trainer_id)) {
        throw new AppError('Athlete is already connected with another trainer', 400);
    }

    await User.approvePendingTrainerClientRequest(request.athlete_id, request.trainer_id);
    return successResponse(res, TrainerDTO.toConnectionRequest(request), 'Request approved successfully');
});

//POST /api/trainers/requests/:athleteId/:trainerId/reject
const rejectRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const {athleteId, trainerId} = req.params;

    if (role !== 'athlete' && role !== 'trainer') {
        throw new AppError('Only athletes and trainers can reject requests', 403);
    }

    const request = await User.getPendingTrainerClientRequest(athleteId, trainerId);
    if (!request) {
        throw new AppError('Request not found', 404);
    }

    const isRecipient = (role === 'athlete' && Number(request.athlete_id) === Number(userId))
        || (role === 'trainer' && Number(request.trainer_id) === Number(userId));
    if (!isRecipient) {
        throw new AppError('You cannot reject this request', 403);
    }

    if (Number(request.requested_by_id) === Number(userId)) {
        throw new AppError('You cannot reject your own request', 400);
    }

    await User.rejectPendingTrainerClientRequest(request.athlete_id, request.trainer_id);
    return successResponse(res, TrainerDTO.toConnectionRequest(request), 'Request rejected successfully');
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
    return createResponse(res, TrainerDTO.toClientAction(client), 'Client successfully removed');
});

//GET /api/trainer/clients/:clientId/workouts
const getClientWorkouts = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client workouts', 403);
    }

    const isMyClient = await verifyTrainerClientRelation(trainerId, clientId);

    const workouts = await Workout.getUserWorkouts(clientId);
    return successResponse(res, TrainerDTO.toClientWorkouts(isMyClient, workouts));
});

//GET /api/trainer/clients/:clientId/body-measurements
const getClientBodyMeasurements = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    
    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client body measurements', 403);
    }
    
    const isMyClient = await verifyTrainerClientRelation(trainerId, clientId);

    const workouts = await Workout.getUserWorkouts(clientId);
    const latestMeasurement = await BodyMeasurement.getLatestMeasurement(clientId);

    const totalWorkouts = workouts.length;
    const totalTonnage = workouts.reduce((sum, w) => sum + (parseFloat(w.total_tonnage) || 0), 0);
    const recentWorkouts = workouts.slice(0, 5);
    const statistics = {
        total_workouts: totalWorkouts,
        total_tonnage: totalTonnage,
        avg_tonnage_per_workout: totalWorkouts > 0 ? (totalTonnage / totalWorkouts).toFixed(2) : 0
    }

    return successResponse(res, TrainerDTO.toClientStatistics(isMyClient, statistics, latestMeasurement, recentWorkouts));
});

//GET /api/trainers/clients/:clientId/body-measurements/progress
const getClientBodyMeasurementProgress = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    const {field, startDate, endDate} = req.query;

    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client body measurement progress', 403);
    }

    const validFields = ['body_weight', 'height', 'chest', 'waist', 'hips', 'biceps'];
    if (!field || !validFields.includes(field)) {
        throw new AppError('Invalid measurement field', 400);
    }

    validateRequired(startDate, 'Start date');
    validateRequired(endDate, 'End date');

    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        throw new AppError('Invalid date format', 400);
    }

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    if (rangeStart > rangeEnd) {
        throw new AppError('Start date cannot be after end date', 400);
    }

    const isMyClient = await verifyTrainerClientRelation(trainerId, clientId);
    const progressData = await BodyMeasurement.getMeasurementProgress(clientId, field, rangeStart, rangeEnd);

    return successResponse(res, {
        client: TrainerDTO.toClientInfo(isMyClient),
        field,
        startDate,
        endDate,
        totalEntries: progressData.length,
        progressData: BodyMeasurementDTO.toProgressArray(progressData)
    });
});

//GET /api/trainers/clients/:clientId/health-metrics/daily
const getClientDailyHealthMetrics = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10);

    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client health metrics', 403);
    }

    const isMyClient = await verifyTrainerClientRelation(trainerId, clientId);

    const dayDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(dayDate.getTime())) {
        throw new AppError('Invalid date format', 400);
    }

    const metrics = await HealthMetrics.getMetricsByDateRange(clientId, dayDate, dayDate, 'daily');
    const metricsList = HealthMetricsDTO.toListArray(metrics);

    const totalEnergyBurned = metrics.reduce((sum, item) => sum + (Number(item.total_energy_burned) || 0), 0);
    const totalStepCount = metrics.reduce((sum, item) => sum + (Number(item.step_count) || 0), 0);
    const heartRates = metrics
        .map((item) => Number(item.avg_heart_rate))
        .filter((value) => Number.isFinite(value) && value > 0);
    const avgHeartRate = heartRates.length > 0
        ? Number((heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length).toFixed(1))
        : 0;

    return successResponse(res, {
        client: TrainerDTO.toClientInfo(isMyClient),
        date,
        summary: {
            totalEnergyBurned,
            totalStepCount,
            avgHeartRate
        },
        metrics: metricsList
    });
});

//GET /api/trainers/clients/:clientId/health-metrics/range
const getClientHealthMetricsByRange = asyncHandler(async (req, res) => {
    const trainerId = req.user.id;
    const userRole = req.user.role;
    const {clientId} = req.params;
    const {start_date, end_date} = req.query;

    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can access client health metrics', 403);
    }

    validateRequired(start_date, 'Start date');
    validateRequired(end_date, 'End date');

    const isMyClient = await verifyTrainerClientRelation(trainerId, clientId);

    const startDate = new Date(`${start_date}T00:00:00`);
    const endDate = new Date(`${end_date}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new AppError('Invalid date format', 400);
    }

    const metrics = await HealthMetrics.getMetricsByDateRange(clientId, startDate, endDate, 'daily');
    const metricsList = HealthMetricsDTO.toListArray(metrics);

    return successResponse(res, {
        client: TrainerDTO.toClientInfo(isMyClient),
        range: {
            startDate: start_date,
            endDate: end_date
        },
        metrics: metricsList
    });
});

module.exports = {
    getClients,
    addClient,
    searchAthletes,
    searchTrainers,
    getMyTrainer,
    unlinkMyTrainer,
    selectTrainer,
    getIncomingRequests,
    getOutgoingRequests,
    approveRequest,
    rejectRequest,
    removeClient,
    getClientWorkouts,
    getClientBodyMeasurements,
    getClientBodyMeasurementProgress,
    getClientDailyHealthMetrics,
    getClientHealthMetricsByRange
};
