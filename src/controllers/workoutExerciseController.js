const WorkoutExercise = require("../models/WorkoutExercise");
const Workout = require("../models/Workout");
const Exercise = require("../models/Exercise");

//POST /api/workouts/:workoutId/exercises
const addExerciseToWorkout = async (req, res) =>{
    try {
        const {workoutId} = req.params;
        const {exercise_id, exercise_order} = req.body;
        const userId = req.user.id;

        if (!exercise_id) {
            return res.status(400).json({
                success: false,
                message: 'Exercise ID is required'
            });
        }

        const workout = await Workout.getWorkoutById(workoutId);
        
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        if (workout.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const exercise = await Exercise.getExerciseById(exercise_id);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        if (exercise.is_custom && exercise.creator_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        let order = exercise_order;
        if (!order) {
            const existingExercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
            order = existingExercises.length + 1;
        }

        const newWorkoutExercise = await WorkoutExercise.addExerciseToWorkout(workoutId, exercise_id, order);
        const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);

        const addedExercise = exercises.find(ex => ex.id === newWorkoutExercise.id);

        res.status(201).json({
            success: true,
            message: 'Exercise added to workout successfully',
            data: addedExercise
        });
        
    } catch (error) {
        console.error('Add exercise to workout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add exercise to workout',
            error: error.message
        });
    }
};

//GET /api/workouts/:workoutId/exercises

const getWorkoutExercises = async (req, res) => {
    try {
        const {workoutId} = req.params;
        const userId = req.user.id;

        const workout = await Workout.getWorkoutById(workoutId);
        
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        
        if (workout.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
        
        res.status(200).json({
            success: true,
            data: exercises
        });
    } catch (error) {
        console.error('Get workout exercises error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get workout exercises',
            error: error.message
        });
    }

};

//PUT /api/workouts/:workoutId/exercises/:exerciseId/tonnage
const updateExerciseTonnage = async (req, res) => {
    try {
        const {workoutId, exerciseId} = req.params;
        const userId = req.user.id;
        
        const workout = await Workout.getWorkoutById(workoutId);
        
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        
        if (workout.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
        const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));
        
        if (!workoutExercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found in this workout'
            });
        }

       const {exercise_tonnage} = await WorkoutExercise.calculateExerciseTonnage(workoutExercise.id);

       await Workout.calculateTotalTonnage(workoutId);
       
        res.status(200).json({
            success: true,
            message: 'Exercise tonnage updated successfully',
            data: {
                workout_id: workoutId,
                exercise_id: exerciseId,
                exercise_tonnage: exercise_tonnage
            }
        });


    } catch (error) {
        console.error('Update exercise tonnage error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update exercise tonnage',
            error: error.message
        });
    }
};

//DELETE /api/workouts/:workoutId/exercises/:exerciseId
const deleteExerciseFromWorkout = async (req, res) => {
    try {
        const {workoutId, exerciseId} = req.params;
        const userId = req.user.id;

        const workout = await Workout.getWorkoutById(workoutId);
        
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        
        if (workout.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
        const exerciseExists = exercises.find(ex => ex.exercise_id === parseInt(exerciseId));

        if (!exerciseExists) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found in this workout'
            });
        }

        await WorkoutExercise.removeExerciseFromWorkout(workoutId, exerciseId);
        await Workout.calculateTotalTonnage(workoutId);

        res.status(200).json({
            success: true,
            message: 'Exercise removed from workout successfully'
        });

    } catch (error) {
        console.error('Delete exercise from workout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove exercise from workout',
            error: error.message
        });
    }
};

module.exports = {
    addExerciseToWorkout,
    getWorkoutExercises,
    updateExerciseTonnage,
    deleteExerciseFromWorkout
};