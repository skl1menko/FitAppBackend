const BodyMeasurement = require('../models/BodyMeasurement');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateNumericFields, validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const BodyMeasurementDTO = require('../dto/bodyMeasurements.dto');

//POST /api/body-measurements
const addBodyMeasurement = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {bodyWeight, height, chest, waist, hips, biceps, notes} = req.body;

    if (!bodyWeight && !height && !chest && !waist && !hips && !biceps) {
        throw new AppError('At least one measurement is required', 400);
    }

    const numericFields = {bodyWeight, height, chest, waist, hips, biceps};
    validateNumericFields(numericFields);

    const measurementData = {
        bodyWeight: bodyWeight || null,
        height: height || null,
        chest: chest || null,
        waist: waist || null,
        hips: hips || null,
        biceps: biceps || null,
        notes: notes || null
    };

    const newMeasurement = await BodyMeasurement.createMeasurement(userId, measurementData);
    const createdMeasurement = await BodyMeasurement.getMeasurementById(newMeasurement.id);
    
    return createResponse(res, BodyMeasurementDTO.toDetail(createdMeasurement), 'Body measurement added successfully');
});

//GET /api/body-measurements
const getBodyMeasurements = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const measurements = await BodyMeasurement.getUserMeasurements(userId);
    return successResponse(res, BodyMeasurementDTO.toListArray(measurements));
});

//GET /api/body-measurements/latest
const getLatestBodyMeasurement = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const measurement = await BodyMeasurement.getLatestMeasurement(userId);
    
    if (!measurement) {
        throw new AppError('No body measurements found', 404);
    }
    
    return successResponse(res, BodyMeasurementDTO.toDetail(measurement));
});



//GET /api/body-measurements/range?startDate=&endDate=
const getBodyMeasurementsByDateRange = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {startDate, endDate} = req.query;

    validateRequired(startDate, 'Start date');
    validateRequired(endDate, 'End date');

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError('Invalid date format', 400);
    }

    if (start > end) {
        throw new AppError('Start date cannot be after end date', 400);
    }

    const measurements = await BodyMeasurement.getMeasurementsByDateRange(userId, start, end);
    return successResponse(res, BodyMeasurementDTO.toListArray(measurements));

});



//PUT /api/body-measurements/:id
const updateBodyMeasurement = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {id} = req.params;
    const {bodyWeight, height, chest, waist, hips, biceps, notes} = req.body;
    
    const measurement = await BodyMeasurement.getMeasurementById(id);
    
    if (!measurement) {
        throw new AppError('Body measurement not found', 404);
    }
    
    if (measurement.user_id !== userId) {
        throw new AppError('You are not authorized to update this measurement', 403);
    }

    if (bodyWeight === undefined && height === undefined && chest === undefined && waist === undefined && hips === undefined && biceps === undefined && notes === undefined) {
        throw new AppError('At least one measurement field is required', 400);
    }
    
    const numericFields = {bodyWeight, height, chest, waist, hips, biceps};
    validateNumericFields(numericFields);
    const updatedData = {
        bodyWeight: bodyWeight !== undefined ? bodyWeight : measurement.body_weight,
        height: height !== undefined ? height : measurement.height,
        chest: chest !== undefined ? chest : measurement.chest,
        waist: waist !== undefined ? waist : measurement.waist, 
        hips: hips !== undefined ? hips : measurement.hips,
        biceps: biceps !== undefined ? biceps : measurement.biceps,
        notes: notes !== undefined ? notes : measurement.notes
    };

    await BodyMeasurement.updateMeasurement(id, updatedData);
    const updatedMeasurement = await BodyMeasurement.getMeasurementById(id);
    
    return createResponse(res, BodyMeasurementDTO.toDetail(updatedMeasurement), 'Body measurement updated successfully');
});

//DELETE /api/body-measurements/:id
const deleteBodyMeasurement = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {id} = req.params;
    
    const existingMeasurement = await BodyMeasurement.getMeasurementById(id);
    if (!existingMeasurement) {
        throw new AppError('Body measurement not found', 404);
    }
    
    if (existingMeasurement.user_id !== userId) {
        throw new AppError('You are not authorized to delete this measurement', 403);
    }
    await BodyMeasurement.deleteMeasurementById(id);
    return successResponse(res, null, 'Body measurement deleted successfully');
});

//GET /api/body-measurements/progress?field=body_weight&startDate=&endDate=
const getBodyMeasurementProgress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {field, startDate, endDate} = req.query;
    
    const validFields = ['body_weight', 'height', 'chest', 'waist', 'hips', 'biceps'];
    if (!field || !validFields.includes(field)) {
        throw new AppError('Invalid measurement field', 400);
    }
    
    validateRequired(startDate, 'Start date');
    validateRequired(endDate, 'End date');
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError('Invalid date format', 400);
    }
    
    if (start > end) {
        throw new AppError('Start date cannot be after end date', 400);
    }
    
    const progressData = await BodyMeasurement.getMeasurementProgress(userId, field, start, end);
    return successResponse(res, {
        field: field,
        startDate: startDate,
        endDate: endDate,
        totalEntries: progressData.length,
        progressData: BodyMeasurementDTO.toProgressArray(progressData)
    });
});

module.exports = {
    addBodyMeasurement,
    getBodyMeasurements,
    getLatestBodyMeasurement,
    getBodyMeasurementsByDateRange,
    updateBodyMeasurement,
    deleteBodyMeasurement,
    getBodyMeasurementProgress
};