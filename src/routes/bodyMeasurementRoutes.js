const express = require('express');
const router = express.Router();
const {
    addBodyMeasurement,
    getBodyMeasurements,
    getLatestBodyMeasurement,
    getBodyMeasurementsByDateRange,
    updateBodyMeasurement,
    deleteBodyMeasurement,
    getBodyMeasurementProgress
} = require('../controllers/bodyMeasurementsController');

const {verifyToken} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', addBodyMeasurement);

router.get('/', getBodyMeasurements);

router.get('/latest', getLatestBodyMeasurement);

router.get('/progress', getBodyMeasurementProgress);

router.get('/range', getBodyMeasurementsByDateRange);

router.put('/:id', updateBodyMeasurement);

router.delete('/:id', deleteBodyMeasurement);



module.exports = router;
