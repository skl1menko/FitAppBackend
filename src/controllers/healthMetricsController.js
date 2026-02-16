const HealthMetrics = require('../models/HealthMetrics');
const Workout = require('../models/Workout');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const {verifyWorkoutAccess} = require('../utils/accessControl');
const HealthMetricsDTO = require('../dto/healthMetrics.dto');

//POST /api/health-metrics
const syncHealthMetricsIOS = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
        workout_id,
        period_type,
        start_date,
        end_date,
        total_energy_burned,
        step_count,
        avg_heart_rate,
        source_name
    } = req.body;

    const validPeriodType = ['workout', 'daily', 'weekly', 'monthly'];
    if (!period_type || !validPeriodType.includes(period_type)) {
        throw new AppError(`Invalid period_type. Must be one of: ${validPeriodType.join(', ')}`, 400);
    }

    validateRequired(start_date, 'Start date');
    validateRequired(end_date, 'End date');

    if (workout_id) {
        await verifyWorkoutAccess(workout_id, userId);
    }

    const metricsData = {
        totalEnergyBurned: total_energy_burned || null,
        stepCount: step_count || null,
        avgHeartRate: avg_heart_rate || null,
        sourceName: source_name || 'Apple Health'
    };

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    // Для периодических метрик (daily, weekly, monthly) проверяем существующую запись
    let metricsId;
    if (period_type !== 'workout') {
        const existingMetric = await HealthMetrics.findExistingMetric(
            userId,
            period_type,
            startDateObj,
            endDateObj,
            workout_id || null
        );

        if (existingMetric) {
            // Обновляем существующую запись
            await HealthMetrics.updateMetrics(existingMetric.id, metricsData);
            metricsId = existingMetric.id;
        } else {
            // Создаем новую запись
            const newMetrics = await HealthMetrics.createMetrics(
                userId,
                workout_id || null,
                period_type,
                startDateObj,
                endDateObj,
                metricsData
            );
            metricsId = newMetrics.id;
        }
    } else {
        // Для тренировок всегда создаем новую запись
        const newMetrics = await HealthMetrics.createMetrics(
            userId,
            workout_id || null,
            period_type,
            startDateObj,
            endDateObj,
            metricsData
        );
        metricsId = newMetrics.id;
    }

    const createMetrics = await HealthMetrics.getMetricsById(metricsId);
    
    return createResponse(res, HealthMetricsDTO.toDetail(createMetrics), 'Health metrics synced successfully');
});

//GET /api/health-metrics
const getHealthMetrics = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {period_type} = req.query;

    if (period_type) {
        const validPeriodType = ['workout', 'daily', 'weekly', 'monthly'];
        if (!validPeriodType.includes(period_type)) {
            throw new AppError(`Invalid period_type. Must be one of: ${validPeriodType.join(', ')}`, 400);
        }
    }

    const metrics = await HealthMetrics.getUserMetrics(userId, period_type || null);
    return successResponse(res, HealthMetricsDTO.toListArray(metrics));
});

//GET /api/health-metrics/workout/:workoutId
const getWorkoutHealthMetrics = asyncHandler(async (req, res) => {
    const {workoutId} = req.params;
    const userId = req.user.id;
    
    await verifyWorkoutAccess(workoutId, userId);
    
    const metrics = await HealthMetrics.getWorkoutsMetricsById(workoutId);
    
    if (!metrics) {
        throw new AppError('No health metrics found for this workout', 404);
    }
    
    return successResponse(res, HealthMetricsDTO.toListArray(metrics));
});

//GET /api/health-metrics/period/:type
const getHealthMetricsByPeriod = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {type} = req.params;
    const {start_date, end_date} = req.query;
    const validPeriodType = ['workout', 'daily', 'weekly', 'monthly'];
    
    if (!validPeriodType.includes(type)) {
        throw new AppError(`Invalid period type. Must be one of: ${validPeriodType.join(', ')}`, 400);
    }

    validateRequired(start_date, 'Start date');
    validateRequired(end_date, 'End date');

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError('Invalid date format', 400);
    }

    // Получаем все метрики за период для детализации (включая тренировки)
    const allMetrics = await HealthMetrics.getMetricsByDateRange(userId, startDate, endDate, null);
    
    // Средние значения считаем только по метрикам указанного типа (без тренировок, чтобы избежать двойного подсчета)
    const avgMetrics = await HealthMetrics.getAverageMetrics(userId, type, startDate, endDate);
    
    return successResponse(res, HealthMetricsDTO.toPeriodSummary(type, startDate, endDate, avgMetrics, allMetrics));
});

module.exports = {
    syncHealthMetricsIOS,
    getHealthMetrics,
    getWorkoutHealthMetrics,
    getHealthMetricsByPeriod
};