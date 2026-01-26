const {AppError} = require('./errorHandler');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

const verifyWorkoutAccess = async (workoutId, userId) => {
    const workout = await Workout.getWorkoutById(workoutId);
    
    if (!workout) {
        throw new AppError('Workout not found', 404);
    }
    
    if (workout.user_id !== userId) {
        throw new AppError('Access denied', 403);
    }
    
    return workout;
};

const verifyExerciseAccess = async (exerciseId, userId) => {
    const exercise = await Exercise.getExerciseById(exerciseId);
    
    if (!exercise) {
        throw new AppError('Exercise not found', 404);
    }
    
    if (exercise.is_custom && exercise.creator_id !== userId) {
        throw new AppError('Access denied to this custom exercise', 403);
    }
    
    return exercise;
};

module.exports = {
    verifyWorkoutAccess,
    verifyExerciseAccess
};
