const express = require('express');
const router = express.Router();
const {
    getClients,
    addClient,
    searchAthletes,
    searchTrainers,
    getMyTrainer,
    unlinkMyTrainer,
    selectTrainer,
    getIncomingRequests,
    getOutgoingRequests,
    approveRequest,
    rejectRequest,
    removeClient,
    getClientWorkouts,
    getClientBodyMeasurements,
    getClientBodyMeasurementProgress,
    getClientDailyHealthMetrics,
    getClientHealthMetricsByRange
} = require('../controllers/trainerController');
const {assignProgramToAthlete, unassignProgramFromAthlete, unassignAllProgramsFromAthlete} = require('../controllers/trainingProgramController');

const {verifyToken} = require('../middleware/authMiddleware');
const {requireRole} = require('../middleware/roleMiddleware');

router.use(verifyToken);

router.get('/search', requireRole('athlete'), searchTrainers);
router.get('/my-trainer', requireRole('athlete'), getMyTrainer);
router.delete('/my-trainer', requireRole('athlete'), unlinkMyTrainer);
router.post('/select', requireRole('athlete'), selectTrainer);
router.get('/requests/incoming', requireRole(['athlete', 'trainer']), getIncomingRequests);
router.get('/requests/outgoing', requireRole(['athlete', 'trainer']), getOutgoingRequests);
router.post('/requests/:athleteId/:trainerId/approve', requireRole(['athlete', 'trainer']), approveRequest);
router.post('/requests/:athleteId/:trainerId/reject', requireRole(['athlete', 'trainer']), rejectRequest);

router.get('/athletes/search', requireRole('trainer'), searchAthletes);

router.get('/clients', requireRole('trainer'), getClients);

router.post('/clients', requireRole('trainer'), addClient);

router.delete('/clients/:clientId', requireRole('trainer'), removeClient);

router.get('/clients/:clientId/workouts', requireRole('trainer'), getClientWorkouts);

router.get('/clients/:clientId/body-measurements', requireRole('trainer'), getClientBodyMeasurements);
router.get('/clients/:clientId/body-measurements/progress', requireRole('trainer'), getClientBodyMeasurementProgress);
router.get('/clients/:clientId/health-metrics/daily', requireRole('trainer'), getClientDailyHealthMetrics);
router.get('/clients/:clientId/health-metrics/range', requireRole('trainer'), getClientHealthMetricsByRange);

router.post('/programs/:id/assign', requireRole('trainer'), assignProgramToAthlete);
router.delete('/programs/:id/assign/:athleteId', requireRole('trainer'), unassignProgramFromAthlete);
router.delete('/programs/assign/:athleteId/all', requireRole('trainer'), unassignAllProgramsFromAthlete);

module.exports = router;
