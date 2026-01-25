const express = require('express');
const router = express.Router();
const {
    getClients,
    addClient,
    removeClient,
    getClientWorkouts,
    getClientBodyMeasurements
} = require('../controllers/trainerController');
const {assignProgramToAthlete} = require('../controllers/trainingProgramController');

const {verifyToken} = require('../middleware/authMiddleware');
const {requireRole} = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(requireRole('trainer'));

router.get('/clients', getClients);

router.post('/clients', addClient);

router.delete('/clients/:clientId', removeClient);

router.get('/clients/:clientId/workouts', getClientWorkouts);

router.get('/clients/:clientId/body-measurements', getClientBodyMeasurements);

router.post('/programs/:id/assign', assignProgramToAthlete);

module.exports = router;
