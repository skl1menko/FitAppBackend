const WorkoutExercise = require("../models/WorkoutExercise");
const Workout = require("../models/Workout");
const Exercise = require("../models/Exercise");
const WorkoutSet = require("../models/WorkoutSet");
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const {verifyWorkoutAccess, verifyExerciseAccess} = require('../utils/accessControl');

//POST /api/workouts/:workoutId/exercises
const addExerciseToWorkout = asyncHandler(async (req, res) => {
    const {workoutId} = req.params;
    const {exercise_id, exercise_order} = req.body;
    const userId = req.user.id;

    validateRequired(exercise_id, 'Exercise ID');

    await verifyWorkoutAccess(workoutId, userId);
    await verifyExerciseAccess(exercise_id, userId);

    let order = exercise_order;
    if (!order) {
        const existingExercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
        order = existingExercises.length + 1;
    }

    const newWorkoutExercise = await WorkoutExercise.addExerciseToWorkout(workoutId, exercise_id, order);
    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const addedExercise = exercises.find(ex => ex.id === newWorkoutExercise.id);

    return createResponse(res, addedExercise, 'Exercise added to workout successfully');
});

//GET /api/workouts/:workoutId/exercises
const getWorkoutExercises = asyncHandler(async (req, res) => {
    const {workoutId} = req.params;
    const userId = req.user.id;

    await verifyWorkoutAccess(workoutId, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    
    const exercisesWithSets = await Promise.all(
        exercises.map(async (exercise) => {
            const sets = await WorkoutSet.getSetsByWorkoutExercise(exercise.id);
            return {
                ...exercise,
                sets
            };
        })
    );

    return successResponse(res, exercisesWithSets);
});

//PUT /api/workouts/:workoutId/exercises/:exerciseId/tonnage
const updateExerciseTonnage = asyncHandler(async (req, res) => {
    const {workoutId, exerciseId} = req.params;
    const userId = req.user.id;
    
    await verifyWorkoutAccess(workoutId, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));
    
    if (!workoutExercise) {
        throw new AppError('Exercise not found in this workout', 404);
    }

    const {exercise_tonnage} = await WorkoutExercise.calculateExerciseTonnage(workoutExercise.id);
    await Workout.calculateTotalTonnage(workoutId);
   
    return successResponse(res, {
        workout_id: workoutId,
        exercise_id: exerciseId,
        exercise_tonnage: exercise_tonnage
    }, 'Exercise tonnage updated successfully');
});

//DELETE /api/workouts/:workoutId/exercises/:exerciseId
const deleteExerciseFromWorkout = asyncHandler(async (req, res) => {
    const {workoutId, exerciseId} = req.params;
    const userId = req.user.id;

    await verifyWorkoutAccess(workoutId, userId);

    const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
    const exerciseExists = exercises.find(ex => ex.exercise_id === parseInt(exerciseId));

    if (!exerciseExists) {
        throw new AppError('Exercise not found in this workout', 404);
    }

    await WorkoutExercise.removeExerciseFromWorkout(workoutId, exerciseId);
    await Workout.calculateTotalTonnage(workoutId);

    return successResponse(res, null, 'Exercise removed from workout successfully');
});

module.exports = {
    addExerciseToWorkout,
    getWorkoutExercises,
    updateExerciseTonnage,
    deleteExerciseFromWorkout
};