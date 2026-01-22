const WorkoutSet = require('../models/WorkoutSet');
const WorkoutExercise = require('../models/WorkoutExercise');
const Workout = require('../models/Workout');

//POST /api/workouts/:workoutId/exercises/:exerciseId/sets
const addSet = async (req, res) => {
    try {
        const {workoutId, exerciseId} = req.params;
        const {weight_kg, reps, rpe} = req.body;
        const userId = req.user.id;

        if (!weight_kg || !reps) {
            return res.status(400).json({
                success: false,
                message: 'Weight and reps are required'
            });
        }

        if (isNaN(weight_kg) || isNaN(reps) || (rpe && isNaN(rpe))) {
            return res.status(400).json({
                success: false,
                message: 'Weight, reps, and RPE must be valid numbers'
            });
        }

        if (weight_kg <=0 || reps <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Weight and reps must be positive numbers'
            });
        }

        if (rpe && (rpe < 1 || rpe > 10)) {
            return res.status(400).json({
                success: false,
                message: 'RPE must be between 1 and 10'
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

        const exercises = await WorkoutExercise.getExercisesByWorkoutId(workoutId);
        const workoutExercise = exercises.find(ex => ex.id === parseInt(exerciseId));

        if (!workoutExercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found in this workout'
            });
        }

        const newSet = await WorkoutSet.createWorkoutSet(
            exerciseId,
            weight_kg,
            reps,
            rpe || null
        );

        await WorkoutExercise.calculateExerciseTonnage(exerciseId);

        await Workout.calculateTotalTonnage(workoutId);

        const createdSet = await WorkoutSet.getSetById(newSet.id);
        
        return res.status(201).json({
            success: true,
            message: 'Set added successfully',
            data: createdSet
        });
        
    } catch (error) {
        console.error('Add set error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add set',
            error: error.message
        });
    }
};

//GET /api/workouts/:workoutId/exercises/:exerciseId/sets
const getExerciseSets = async (req, res) => {
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

        const sets = await WorkoutSet.getSetsByWorkoutExercise(exerciseId);

        res.status(200).json({
            success: true,
            data: sets
        });
    } catch (error) {
        console.error('Get exercise sets error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get exercise sets',
            error: error.message
        });
    }
};

//PUT /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
const updateSet = async (req, res) => {
    try {
        const {workoutId, exerciseId, setId} = req.params;
        const {weight_kg, reps, rpe} = req.body;
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

        const existingSet = await WorkoutSet.getSetById(setId);
        if (!existingSet) {
            return res.status(404).json({
                success: false,
                message: 'Set not found'
            });
        }

        if (existingSet.workout_exercise_id !== parseInt(exerciseId)) {
            return res.status(400).json({
                success: false,
                message: 'Set does not belong to the specified exercise in this workout'
            });
        }

        const updateWeightKg = weight_kg !== undefined ? weight_kg : existingSet.weight_kg;
        const updateReps = reps !== undefined ? reps : existingSet.reps;
        const updateRpe = rpe !== undefined ? rpe : existingSet.rpe;

        await WorkoutSet.updateWorkoutSet(
            setId,
            updateWeightKg,
            updateReps,
            updateRpe
        );
        
        await WorkoutExercise.calculateExerciseTonnage(exerciseId);

        await Workout.calculateTotalTonnage(workoutId);

        const updatedSet = await WorkoutSet.getSetById(setId);
        
        res.status(200).json({
            success: true,
            message: 'Set updated successfully',
            data: updatedSet
        });     

    } catch (error) {
        console.error('Update set error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update set',
            error: error.message
        });
    }
};

//DELETE /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
const deleteSet = async (req, res) => {
    try {
        const {workoutId, exerciseId, setId} = req.params;
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
        
        const existingSet = await WorkoutSet.getSetById(setId);
        if (!existingSet) {
            return res.status(404).json({
                success: false,
                message: 'Set not found'
            });
        }

        if (existingSet.workout_exercise_id !== parseInt(exerciseId)) {
            return res.status(400).json({
                success: false,
                message: 'Set does not belong to the specified exercise in this workout'
            });
        }

        await WorkoutSet.deleteWorkoutSet(setId);

        await WorkoutExercise.calculateExerciseTonnage(exerciseId);

        await Workout.calculateTotalTonnage(workoutId);

        res.status(200).json({
            success: true,
            message: 'Set deleted successfully'
        });
    } catch (error) {
        console.error('Delete set error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete set',
            error: error.message
        });
    }
};

module.exports = {
    addSet,
    getExerciseSets,
    updateSet,
    deleteSet
};

