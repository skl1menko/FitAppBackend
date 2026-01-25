const express = require('express');
const router = express.Router();
const {
    createTrainingProgram,
    getAllPrograms,
    getProgramById,
    getMyAssignedPrograms,
    updateTrainingProgram,
    deleteTrainingProgram
} = require('../controllers/trainingProgramController');

const {verifyToken} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', createTrainingProgram);

router.get('/', getAllPrograms);

router.get('/my-assigned',getMyAssignedPrograms);

router.get('/:id', getProgramById);

router.put('/:id', updateTrainingProgram);

router.delete('/:id', deleteTrainingProgram);

module.exports = router;