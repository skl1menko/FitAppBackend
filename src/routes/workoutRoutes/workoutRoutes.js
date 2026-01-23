const express = require('express');
const router = express.Router();
const {
    createWorkout,
    getMyWorkouts,
    getWorkoutById,
    getWorkoutByDateRange,
    updateWorkout,
    deleteWorkout,
    calculateWorkoutTonnage
} = require('../../controllers/workoutController');
const {verifyToken} = require('../../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', createWorkout);

router.get('/', getMyWorkouts);

router.get('/range', getWorkoutByDateRange);

router.get('/:id', getWorkoutById);

router.put('/:id', updateWorkout);

router.delete('/:id', deleteWorkout);

router.post('/:id/calculate', calculateWorkoutTonnage);

module.exports = router;