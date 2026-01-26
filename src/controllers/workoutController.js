const Workout = require("../models/Workout");
const WorkoutExercise = require("../models/WorkoutExercise");
const WorkoutSet = require("../models/WorkoutSet");
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const {verifyWorkoutAccess} = require('../utils/accessControl');

//POST /api/workouts
const createWorkout = asyncHandler(async (req, res) => {
    const {program_id, name, notes} = req.body;
    const userId = req.user.id;
    const startTime = new Date();

    const newWorkout = await Workout.createWorkout(
        userId,
        program_id || null,
        startTime,
        name || null,
        notes || null
    );

    const workout = await Workout.getWorkoutById(newWorkout.id);
    
    return createResponse(res, workout, 'Workout created successfully');
});

//GET /api/workouts
const getMyWorkouts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const workouts = await Workout.getUserWorkouts(userId);
    return successResponse(res, workouts);
});

//GET /api/workouts/:id
const getWorkoutById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    const workout = await verifyWorkoutAccess(id, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(id);

    const exercisesWithSets = await Promise.all(
        exercises.map(async (exercise) => {
            const sets = await WorkoutSet.getSetsByWorkoutExercise(exercise.id);
            return {
                ...exercise,
                sets
            };
        })
    );

    return successResponse(res, {
        ...workout,
        exercisesWithSets
    });
});

//GET /api/workouts/range?startDate=&endDate=
const getWorkoutByDateRange = asyncHandler(async (req, res) => {
    const {start, end} = req.query;
    const userId = req.user.id;

    validateRequired(start, 'Start date');
    validateRequired(end, 'End date');

    const startDate = new Date(start);
    const endDate = new Date(end);

    const workout = await Workout.getWorkoutByDateRange(userId, startDate, endDate);
    return successResponse(res, workout);
});

//PUT /api/workouts/:id
const updateWorkout = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, notes, end_time} = req.body;
    const userId = req.user.id;

    await verifyWorkoutAccess(id, userId);

    const endTime = end_time ? new Date(end_time) : null;
    const {totalTonnage} = await Workout.calculateTotalTonnage(id);

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (endTime !== null) updates.endTime = endTime;
    if (notes !== undefined) updates.notes = notes;
    updates.totalTonnage = totalTonnage;

    await Workout.updateWorkout(id, updates);
    const updatedWorkout = await Workout.getWorkoutById(id);
    
    return createResponse(res, updatedWorkout, 'Workout updated successfully');
});

//DELETE /api/workouts/:id
const deleteWorkout = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;
    
    await verifyWorkoutAccess(id, userId);
    await Workout.deleteWorkoutById(id);
    
    return successResponse(res, null, 'Workout deleted successfully');
});

//POST /api/workouts/:id/calculate
const calculateWorkoutTonnage = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;
    
    await verifyWorkoutAccess(id, userId);
    await Workout.calculateTotalTonnage(id);

    const updatedWorkout = await Workout.getWorkoutById(id);
    return createResponse(res, updatedWorkout, 'Workout tonnage calculated successfully');
});

module.exports = {
    createWorkout,
    getMyWorkouts,
    getWorkoutById,
    getWorkoutByDateRange,
    updateWorkout,
    deleteWorkout,
    calculateWorkoutTonnage
};