const express = require('express');
const router = express.Router();
const {
    addSet,
    getExerciseSets,
    updateSet,
    deleteSet
} = require('../../controllers/workoutSetController');
const {verifyToken} = require('../../middleware/authMiddleware');

router.use(verifyToken);

//POST /api/workouts/:workoutId/exercises/:exerciseId/sets
router.post('/:workoutId/exercises/:exerciseId/sets', addSet);

//GET /api/workouts/:workoutId/exercises/:exerciseId/sets
router.get('/:workoutId/exercises/:exerciseId/sets', getExerciseSets);

//PUT /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
router.put('/:workoutId/exercises/:exerciseId/sets/:setId', updateSet);

//DELETE /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
router.delete('/:workoutId/exercises/:exerciseId/sets/:setId', deleteSet);

module.exports = router;