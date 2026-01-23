const express = require('express');
const router = express.Router();
const {
    createExercise,
    getAllExercises,
    getExercisesByMuscleGroup,
    getMyCustomExercises,
    getExerciseById,
    updateExercise,
    deleteExercise
} = require('../controllers/exerciseController');

const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// POST /api/exercises - створити вправу (захищено)
router.post('/',createExercise);

// GET /api/exercises - всі вправи (захищено)
router.get('/', getAllExercises);

// GET /api/exercises/my - мої кастомні вправи
router.get('/my', getMyCustomExercises);

// GET /api/exercises/muscle/:group - по м'язовій групі
router.get('/muscle/:group', getExercisesByMuscleGroup);

// GET /api/exercises/:id - деталі вправи
router.get('/:id', getExerciseById);

// PUT /api/exercises/:id - редагувати
router.put('/:id', updateExercise);

// DELETE /api/exercises/:id - видалити
router.delete('/:id', deleteExercise);

module.exports = router;