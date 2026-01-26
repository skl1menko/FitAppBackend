const BodyMeasurement = require('../models/BodyMeasurement');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateNumericFields} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');

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
    
    return createResponse(res, createdMeasurement, 'Body measurement added successfully');
});

//GET /api/body-measurements
const getBodyMeasurements = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const measurements = await BodyMeasurement.getUserMeasurements(userId);
    return successResponse(res, measurements);
});

//GET /api/body-measurements/latest
const getLatestBodyMeasurement = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const measurement = await BodyMeasurement.getLatestMeasurement(userId);
    
    if (!measurement) {
        throw new AppError('No body measurements found', 404);
    }
    
    return successResponse(res, measurement);
});


//GET /api/body-measurements/range?startDate=&endDate=
const getBodyMeasurementsByDateRange = async (req, res) => {
    try {
        const userId = req.user.id;
        const {startDate, endDate} = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if(isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }

        const measurements = await BodyMeasurement.getMeasurementsByDateRange(userId, start, end);
        return res.status(200).json({
            success: true,
            data: measurements
        });
    } catch (error) {
        console.error('Get body measurements by date range error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get body measurements by date range',
            error: error.message
        });
    }
};

//PUT /api/body-measurements/:id
const updateBodyMeasurement = async (req, res) => {
    try {
        const userId = req.user.id;
        const {id} = req.params;
        const {bodyWeight, height, chest, waist, hips, biceps, notes} = req.body;
        
        const measurement = await BodyMeasurement.getMeasurementById(id);
        
        if (!measurement) {
            return res.status(404).json({
                success: false,
                message: 'Body measurement not found'
            });
        }

        if (measurement.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this measurement'
            });
        }

        if (bodyWeight === undefined && height === undefined && chest === undefined && waist === undefined && hips === undefined && biceps === undefined && notes === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one measurement field is required'
            });
        }

        const numericFields = {bodyWeight, height, chest, waist, hips, biceps};

        for (const [field, value] of Object.entries(numericFields)) {
            if (value !== undefined && value !== null && value <= 0 ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid value for ${field}`
                });
            }
        }

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
        
        return res.status(200).json({
            success: true,
            message: 'Body measurement updated successfully',
            data: updatedMeasurement
        });
    } catch (error) {
        console.error('Update body measurement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update body measurement',
            error: error.message
        });    
    }
            
};

//DELETE /api/body-measurements/:id
const deleteBodyMeasurement = async (req, res) => {
    try {
        const userId = req.user.id;
        const {id} = req.params;

        const existingMeasurement = await BodyMeasurement.getMeasurementById(id);
        if (!existingMeasurement) {
            return res.status(404).json({
                success: false,
                message: 'Body measurement not found'
            });
        }
        
        if (existingMeasurement.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this measurement'
            });
        }
        await BodyMeasurement.deleteMeasurementById(id);
        return res.status(200).json({
            success: true,
            message: 'Body measurement deleted successfully'
        });
    } catch (error) {
        console.error('Delete body measurement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete body measurement',
            error: error.message
        });
    }
};

//GET /api/body-measurements/progress?field=body_weight&startDate=&endDate=
const getBodyMeasurementProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const {field, startDate, endDate} = req.query;

        const validFields = ['body_weight', 'height', 'chest', 'waist', 'hips', 'biceps'];
        if (!field || !validFields.includes(field)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid measurement field'
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if(isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }

        const progressData = await BodyMeasurement.getMeasurementProgress(userId, field, start, end);
        return res.status(200).json({
            success: true,
            data: {
                field: field,
                start_date: startDate,
                end_date: endDate,
                total_entries: progressData.length,
                progress_data: progressData
            }
        });
    } catch (error) {
        console.error('Get body measurement progress error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get body measurement progress',
            error: error.message
        });
    }
};

module.exports = {
    addBodyMeasurement,
    getBodyMeasurements,
    getLatestBodyMeasurement,
    getBodyMeasurementsByDateRange,
    updateBodyMeasurement,
    deleteBodyMeasurement,
    getBodyMeasurementProgress
};