const {pool} = require('../config/database');

class HealthMetrics{
    static async createMetrics(userId, workoutId, periodType, startDate, endDate, data){
        const {totalEnergyBurned, stepCount, avgHeartRate, sourceName} = data;

        const result = await pool.query(
            `INSERT INTO health_metrics(user_id, workout_id, period_type, start_date, end_date, total_energy_burned, step_count, avg_heart_rate, source_name)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id`,
            [userId, workoutId, periodType, startDate, endDate, totalEnergyBurned, stepCount, avgHeartRate, sourceName]
        );
        return {id: result.rows[0].id};
    }

    static async getMetricsById(id){
        const result = await pool.query(
            `SELECT hm.*, u.full_name as user_name
            FROM health_metrics hm
            LEFT JOIN users u ON hm.user_id = u.id
            WHERE hm.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getUserMetrics(userId, periodType){
        let query = 
            `SELECT * FROM health_metrics
            WHERE user_id = $1`
        ;

        const params = [userId];

        if(periodType){
            query += ` AND period_type = $2`;
            params.push(periodType);
        }

        query += ` ORDER BY start_date DESC`;

        const result = await pool.query(query,params);
        return result.rows;
    }

    static async getMetricsByDateRange(userId, startDate, endDate, periodType = null){
        let query = `SELECT * FROM health_metrics
            WHERE user_id = $1
            AND DATE(start_date) >= DATE($2)
            AND DATE(end_date) <= DATE($3)`;
        
        const params = [userId, startDate, endDate];
        
        if (periodType) {
            query += ` AND period_type = $4`;
            params.push(periodType);
        }
        
        query += ` ORDER BY start_date DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getWorkoutsMetricsById(workoutId){
        const result = await pool.query(
            `SELECT * FROM health_metrics
            WHERE workout_id = $1`,
            [workoutId]
        );
        return result.rows;
    }

    static async findExistingMetric(userId, periodType, startDate, endDate, workoutId = null){
        let query = `SELECT * FROM health_metrics
            WHERE user_id = $1
            AND period_type = $2
            AND DATE(start_date) = DATE($3)
            AND DATE(end_date) = DATE($4)`;
        
        const params = [userId, periodType, startDate, endDate];
        
        if (workoutId) {
            query += ` AND workout_id = $5`;
            params.push(workoutId);
        } else {
            query += ` AND workout_id IS NULL`;
        }
        
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async updateMetrics(id, data){
        const {totalEnergyBurned, stepCount, avgHeartRate, sourceName} = data;

        const result = await pool.query(
            `UPDATE health_metrics
            SET total_energy_burned = $1,
                step_count = $2,
                avg_heart_rate = $3,
                source_name = $4
            WHERE id = $5
            RETURNING id`,
            [totalEnergyBurned, stepCount, avgHeartRate, sourceName, id]
        );
        return {id: result.rows[0].id, changes: result.rowCount};
    }

    static async getAverageMetrics(userId, periodType, startDate, endDate){
        let query = `SELECT
            SUM(total_energy_burned) as total_energy_burned,
            SUM(step_count) as total_step_count,
            AVG(avg_heart_rate) as avg_heart_rate
            FROM health_metrics
            WHERE user_id = $1
            AND DATE(start_date) >= DATE($2)
            AND DATE(end_date) <= DATE($3)`;
        
        const params = [userId, startDate, endDate];
        
        if (periodType) {
            query += ` AND period_type = $4`;
            params.push(periodType);
        }
        
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async deleteMetricsById(id){
        const result = await pool.query(
            `DELETE FROM health_metrics WHERE id = $1`,
            [id]
        );
        return {deleted: result.rowCount};
    }
}

module.exports = HealthMetrics;
