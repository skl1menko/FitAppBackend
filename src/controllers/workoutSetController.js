const WorkoutSet = require('../models/WorkoutSet');
const WorkoutExercise = require('../models/WorkoutExercise');
const Workout = require('../models/Workout');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateNonNegativeNumber, validateRange} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const {verifyWorkoutAccess} = require('../utils/accessControl');
const WorkoutSetDTO = require('../dto/workoutSet.dto');

//POST /api/workouts/:workoutId/exercises/:exerciseId/sets
const addSet = asyncHandler(async (req, res) => {
    const {workoutId, exerciseId} = req.params;
    const {weight_kg, reps, rpe} = req.body;
    const userId = req.user.id;

    if (weight_kg === undefined || weight_kg === null || (typeof weight_kg === 'string' && weight_kg.trim() === '')) {
        throw new AppError('Weight is required', 400);
    }

    if (reps === undefined || reps === null || (typeof reps === 'string' && reps.trim() === '')) {
        throw new AppError('Reps is required', 400);
    }

    validateNonNegativeNumber(weight_kg, 'Weight');
    validateNonNegativeNumber(reps, 'Reps');

    const normalizedRpe = (rpe === '' || rpe === 0 || rpe === '0') ? null : rpe;
    if (normalizedRpe !== null && normalizedRpe !== undefined) {
        validateRange(normalizedRpe, 'RPE', 1, 10);
    }
    
    await verifyWorkoutAccess(workoutId, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));

    if (!workoutExercise) {
        throw new AppError('Exercise not found in this workout', 404);
    }

    const newSet = await WorkoutSet.createWorkoutSet(
        exerciseId,
        weight_kg,
        reps,
        normalizedRpe
    );

    await WorkoutExercise.calculateExerciseTonnage(exerciseId);
    await Workout.calculateTotalTonnage(workoutId);

    const createdSet = await WorkoutSet.getSetById(newSet.id);
    
    return createResponse(res, WorkoutSetDTO.toDetail(createdSet), 'Set added successfully');
});

//GET /api/workouts/:workoutId/exercises/:exerciseId/sets
const getExerciseSets = asyncHandler(async (req, res) => {
    const {workoutId, exerciseId} = req.params;
    const userId = req.user.id;

    await verifyWorkoutAccess(workoutId, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));

    if (!workoutExercise) {
        throw new AppError('Exercise not found in this workout', 404);
    }

    const sets = await WorkoutSet.getSetsByWorkoutExercise(exerciseId);

    return successResponse(res, WorkoutSetDTO.toListArray(sets));
});

//PUT /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
const updateSet = asyncHandler(async (req, res) => {
    const {workoutId, exerciseId, setId} = req.params;
    const {weight_kg, reps, rpe} = req.body;
    const userId = req.user.id;

    await verifyWorkoutAccess(workoutId, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));

    if (!workoutExercise) {
        throw new AppError('Exercise not found in this workout', 404);
    }

    const existingSet = await WorkoutSet.getSetById(setId);
    if (!existingSet) {
        throw new AppError('Set not found', 404);
    }

    if (existingSet.workout_exercise_id !== parseInt(exerciseId)) {
        throw new AppError('Set does not belong to the specified exercise in this workout', 400);
    }

    if (weight_kg !== undefined) {
        validateNonNegativeNumber(weight_kg, 'Weight');
    }

    if (reps !== undefined) {
        validateNonNegativeNumber(reps, 'Reps');
    }

    const normalizedRpe = (rpe === '' || rpe === 0 || rpe === '0') ? null : rpe;
    if (normalizedRpe !== undefined && normalizedRpe !== null) {
        validateRange(normalizedRpe, 'RPE', 1, 10);
    }

    const updateWeightKg = weight_kg !== undefined ? weight_kg : existingSet.weight_kg;
    const updateReps = reps !== undefined ? reps : existingSet.reps;
    const updateRpe = rpe !== undefined ? normalizedRpe : existingSet.rpe;

    await WorkoutSet.updateWorkoutSet(setId, updateWeightKg, updateReps, updateRpe);
    
    await WorkoutExercise.calculateExerciseTonnage(exerciseId);
    await Workout.calculateTotalTonnage(workoutId);

    const updatedSet = await WorkoutSet.getSetById(setId);
    
    return successResponse(res, WorkoutSetDTO.toDetail(updatedSet), 'Set updated successfully');
});

//DELETE /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
const deleteSet = asyncHandler(async (req, res) => {
    const {workoutId, exerciseId, setId} = req.params;
    const userId = req.user.id;

    await verifyWorkoutAccess(workoutId, userId);
    
    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));
    
    if (!workoutExercise) {
        throw new AppError('Exercise not found in this workout', 404);
    }
    
    const existingSet = await WorkoutSet.getSetById(setId);
    if (!existingSet) {
        throw new AppError('Set not found', 404);
    }

    if (existingSet.workout_exercise_id !== parseInt(exerciseId)) {
        throw new AppError('Set does not belong to the specified exercise in this workout', 400);
    }

    await WorkoutSet.deleteWorkoutSetById(setId);
    await WorkoutExercise.calculateExerciseTonnage(exerciseId);
    await Workout.calculateTotalTonnage(workoutId);

    return successResponse(res, null, 'Set deleted successfully');
});

module.exports = {
    addSet,
    getExerciseSets,
    updateSet,
    deleteSet
};
