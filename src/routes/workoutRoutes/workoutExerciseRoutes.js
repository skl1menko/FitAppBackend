const express = require('express');
const router = express.Router();
const {
    addExerciseToWorkout,
    getWorkoutExercises,
    updateExerciseTonnage,
    deleteExerciseFromWorkout
} = require('../../controllers/workoutExerciseController');
const {verifyToken} = require('../../middleware/authMiddleware');

router.use(verifyToken);

router.post('/:workoutId/exercises', addExerciseToWorkout);

router.get('/:workoutId/exercises', getWorkoutExercises);

router.put('/:workoutId/exercises/:exerciseId/tonnage', updateExerciseTonnage);

router.delete('/:workoutId/exercises/:exerciseId', deleteExerciseFromWorkout);

module.exports = router;