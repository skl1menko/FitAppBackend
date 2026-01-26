const express = require('express');
const router = express.Router();
const {
    syncHealthMetricsIOS,
    getHealthMetrics,
    getWorkoutHealthMetrics,
    getHealthMetricsByPeriod
} = require('../controllers/healthMetricsController');


const {verifyToken} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/ios', syncHealthMetricsIOS);

router.get('/', getHealthMetrics);

router.get('/workout/:workoutId', getWorkoutHealthMetrics);

router.get('/period/:type', getHealthMetricsByPeriod);

module.exports = router;