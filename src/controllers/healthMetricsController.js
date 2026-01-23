const HealthMetrics = require('../models/HealthMetrics');
const Workout = require('../models/Workout')

//POST /api/health-metrics
const syncHealthMetricsIOS = async (req, res) => {
    try {
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

        const validPeriodType = ['workout' ,'daily', 'weekly', 'monthly'];
        if (!period_type || !validPeriodType.includes(period_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing period_type'
            });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        if (workout_id) {
            const workout = await Workout.getWorkoutById(workout_id);
            if (!workout) {
                return res.status(404).json({
                    success: false,
                    message: 'Workout not found'
                });
            }

            if (workout.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to associate metrics with this workout'
                });
            }
        }

        const metricsData = {
            totalEnergyBurned: total_energy_burned || null,
            stepCount: step_count || null,
            avgHeartRate: avg_heart_rate || null,
            sourceName: source_name || 'Apple Health'
        };

        const newMetrics = await HealthMetrics.createMetrics(
            userId,
            workout_id || null,
            period_type,
            new Date(start_date),
            new Date(end_date),
            metricsData
        );

        const createMetrics = await HealthMetrics.getMetricsById(newMetrics.id);
        
        return res.status(201).json({
            success: true,
            message: 'Health metrics created successfully',
            data: createMetrics
        });
    } catch (error) {
        console.error('Sync health metrics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to sync health metrics',
            error: error.message
        });
        
    }
};

//GET /api/health-metrics
const getHealthMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        const {period_type} = req.query;

        if (period_type) {
            const validPeriodType = ['workout' ,'daily', 'weekly', 'monthly'];
            if (!validPeriodType.includes(period_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid period_type'
                });
            }
        }

        const metrics = await HealthMetrics.getUserMetrics(userId, period_type || null);
        return res.status(200).json({
            success: true,
            data: metrics
        });

    } catch (error) {
        console.error('Get health metrics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get health metrics',
            error: error.message
        });
    }
};

//GET /api/health-metrics/workout/:workoutId
const getWorkoutHealthMetrics = async (req, res) => {
    try {
        const {workoutId} = req.params;
        const userId = req.user.id;
        
        const workout = await Workout.getWorkoutById(workoutId);
        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        
        if (workout.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access metrics for this workout'
            });
        }
        const metrics = await HealthMetrics.getWorkoutsMetricsById(workoutId);
        
        if (!metrics) {
            return res.status(404).json({
                success: false,
                message: 'No health metrics found for this workout'
            });
        }
        return res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {   
        console.error('Get workout health metrics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get workout health metrics',
            error: error.message
        });
        
    }
};

//GET /api/health-metrics/period/:type
const getHealthMetricsByPeriod = async (req, res) => {
    try {
        const userId = req.user.id;
        const {type} = req.params;
        const {start_date, end_date} = req.query;
        const validPeriodType = ['workout' ,'daily', 'weekly', 'monthly'];
        
        if (!validPeriodType.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid period type'
            });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        const detailedMetrics = await HealthMetrics.getMetricsByDateRange(userId, startDate, endDate);
        
        const avgMetrics = await HealthMetrics.getAverageMetrics(userId, type, startDate, endDate);
        return res.status(200).json({
            success: true,
            data: {
                period_type: type,
                start_date: startDate,
                end_date: endDate,
                average_metrics: {
                    avg_energy_burned: parseFloat(avgMetrics.avg_energy_burned) || 0,
                    avg_step_count: parseFloat(avgMetrics.avg_step_count) || 0,
                    avg_heart_rate: parseFloat(avgMetrics.avg_heart_rate) || 0
                },
                total_entries: detailedMetrics.length,
                detailed_metrics: detailedMetrics
            }
        });
    } catch (error) {
        console.error('Get health metrics by period error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get health metrics by period',
            error: error.message
        });
    }
};

module.exports = {
    syncHealthMetricsIOS,
    getHealthMetrics,
    getWorkoutHealthMetrics,
    getHealthMetricsByPeriod
};