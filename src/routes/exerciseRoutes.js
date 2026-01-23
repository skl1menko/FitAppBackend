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

// POST /api/exercises - створити вправу (захищено)
router.post('/', verifyToken, createExercise);

// GET /api/exercises - всі вправи (захищено)
router.get('/', verifyToken, getAllExercises);

// GET /api/exercises/my - мої кастомні вправи
router.get('/my', verifyToken, getMyCustomExercises);

// GET /api/exercises/muscle/:group - по м'язовій групі
router.get('/muscle/:group', verifyToken, getExercisesByMuscleGroup);

// GET /api/exercises/:id - деталі вправи
router.get('/:id', verifyToken, getExerciseById);

// PUT /api/exercises/:id - редагувати
router.put('/:id', verifyToken, updateExercise);

// DELETE /api/exercises/:id - видалити
router.delete('/:id', verifyToken, deleteExercise);

module.exports = router;