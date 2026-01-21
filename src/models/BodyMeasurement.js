const {pool} = require('../config/database');

class BodyMeasurement{
    static async createMeasurement(userId, measurements){
        const {bodyWeight, height, chest, waist, hips, biceps, notes} = measurements;

        const result = await pool.query(
            `INSERT INTO body_measurements(
            user_id, body_weight, height, chest, waist, hips, biceps, notes)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [userId, bodyWeight, height, chest, waist, hips, biceps, notes]
        );
        return {id: result.rows[0].id};
    }

    static async getMeasurementById(id){
        const result = await pool.query(
            `SELECT bm.*, u.full_name as user_name
            FROM body_measurements bm
            LEFT JOIN users u ON bm.user_id = u.id
            WHERE bm.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getUserMeasurements(userId){
        const result = await pool.query(
            `SELECT * FROM body_measurements
            WHERE user_id = $1
            ORDER BY date DESC`,
            [userId]
        );
        return result.rows;
    }

    static async getMeasurementsByDateRange(userId, startDate, endDate){
        const result = await pool.query(
            `SELECT * FROM body_measurements
            WHERE user_id = $1
            AND date >= $2
            AND date <= $3
            ORDER BY date DESC`,
            [userId, startDate, endDate]
        );
        return result.rows;
    }

    static async getLatestMeasurement(userId){
        const result = await pool.query(
            `SELECT * FROM body_measurements
            WHERE user_id = $1
            ORDER BY date DESC
            LIMIT 1`,
            [userId]
        );
        return result.rows[0];
    }

    static async updateMeasurement(id, measurements){
        const {bodyWeight, height, chest, waist, hips, biceps, notes} = measurements;
        
        const result = await pool.query(
            `UPDATE body_measurements
            SET body_weight = $1,
                height = $2,
                chest = $3,
                waist = $4,
                hips = $5,
                biceps = $6,
                notes = $7
            WHERE id = $8`,
            [bodyWeight, height, chest, waist, hips, biceps, notes, id]
        );
        return {changes: result.rowCount};
    }

    static async deleteMeasurementById(id){
        const result = await pool.query(
            `DELETE FROM body_measurements WHERE id = $1`,
            [id]
        );
        return {deleted: result.rowCount};
    }

    static async getMeasurementProgress(userId, field, startDate, endDate){
        const validFields = ['body_weight', 'height', 'chest', 'waist', 'hips', 'biceps'];
        if (!validFields.includes(field)) {
            throw new Error('Invalid measurement field');
        }
        
        const result = await pool.query(
            `SELECT date, ${field} as value
            FROM body_measurements
            WHERE user_id = $1
            AND date >= $2
            AND date <= $3
            AND ${field} IS NOT NULL
            ORDER BY date ASC`,
            [userId, startDate, endDate]
        );
        return result.rows;
    }
}
module.exports = BodyMeasurement;