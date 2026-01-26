const TrainingProgram = require("../models/TrainingProgram");
const User = require("../models/User");
const Workout = require("../models/Workout");
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');

//POST /api/programs
const createTrainingProgram = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    const userId = req.user.id;
    
    validateRequired(name, 'Program name');

    const newProgram = await TrainingProgram.createTrainingProgram(name, description || null, userId);
    const program = await TrainingProgram.getTrainingProgramById(newProgram.id);

    return createResponse(res, program, 'Training program created successfully');
});

//GET /api/programs
const getAllPrograms = asyncHandler(async (req, res) => {
    const programs = await TrainingProgram.getAllPrograms();
    return successResponse(res, programs);
});

//GET /api/programs/:id
const getProgramById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const program = await TrainingProgram.getTrainingProgramById(id);

    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    const workouts = await Workout.getWorkoutByProgram(id);
    
    return successResponse(res, {
        ...program,
        workouts
    });
});

//GET /api/programs/my-assigned
const getMyAssignedPrograms = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const programs = await TrainingProgram.getAthletePrograms(userId);
    return successResponse(res, programs);
});

//POST /api/programs/:id/assign
const assignProgramToAthlete = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {athleteId} = req.body;
    const trainerId = req.user.id;
    const userRole = req.user.role;

    validateRequired(athleteId, 'Athlete ID');

    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can assign training programs', 403);
    }

    const program = await TrainingProgram.getTrainingProgramById(id);
    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    const athlete = await User.findUserById(athleteId);
    if (!athlete) {
        throw new AppError('Athlete not found', 404);
    }

    if (athlete.role_name !== 'athlete') {
        throw new AppError('The specified user is not an athlete', 400);
    }

    await TrainingProgram.assignProgramToAthlete(id, athleteId, trainerId);
    
    return createResponse(res, {
        program_id: id,
        program_name: program.name,
        athlete_id: athleteId,
        athlete_name: athlete.full_name,
        assigned_by: trainerId
    }, 'Training program assigned to athlete successfully');
});

//PUT /api/programs/:id
const updateTrainingProgram = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, description} = req.body;
    const userId = req.user.id;

    validateRequired(name, 'Program name');

    const program = await TrainingProgram.getTrainingProgramById(id);
    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    if (program.creator_id !== userId) {
        throw new AppError('You are not authorized to update this training program', 403);
    }

    await TrainingProgram.updateProgram(id, name, description || null);
    const updatedProgram = await TrainingProgram.getTrainingProgramById(id);
    
    return createResponse(res, updatedProgram, 'Training program updated successfully');
});

//DELETE /api/programs/:id
const deleteTrainingProgram = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    const program = await TrainingProgram.getTrainingProgramById(id);
    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    if (program.creator_id !== userId) {
        throw new AppError('You are not authorized to delete this training program', 403);
    }

    await TrainingProgram.deleteProgramById(id);
    return successResponse(res, null, 'Training program deleted successfully');
});

module.exports = {
    createTrainingProgram,
    getAllPrograms,
    getProgramById,
    getMyAssignedPrograms,
    assignProgramToAthlete,
    updateTrainingProgram,
    deleteTrainingProgram
};