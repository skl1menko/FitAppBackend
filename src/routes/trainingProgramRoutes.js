const express = require('express');
const router = express.Router();
const {
    createTrainingProgram,
    createTrainingProgramWithWorkouts,
    getAllPrograms,
    getProgramById,
    getMyCreatedPrograms,
    getMyAssignedPrograms,
    getMyPrograms,
    updateTrainingProgram,
    deleteTrainingProgram
} = require('../controllers/trainingProgramController');

const {verifyToken} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', createTrainingProgram);

router.post('/with-workouts', createTrainingProgramWithWorkouts);

router.get('/', getAllPrograms);

router.get('/my', getMyPrograms);

router.get('/my-created', getMyCreatedPrograms);

router.get('/my-assigned',getMyAssignedPrograms);

router.get('/:id', getProgramById);

router.put('/:id', updateTrainingProgram);

router.delete('/:id', deleteTrainingProgram);

module.exports = router;