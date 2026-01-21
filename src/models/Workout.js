const {pool} = require('../config/database');

class Workout{
    static async createWorkout(userId, programId, startTime,notes){
        const result = await pool.query(
            `INSERT INTO workouts(user_id, program_id,start_time, notes)
            VALUES($1, $2, $3, $4) 
            RETURNING id`,
            [userId, programId, startTime, notes]
        );
        return {id: result.rows[0].id};
    }
    
    static async getWorkoutById(id){
        const result = await pool.query(
            `SELECT w.*, u.full_name as user_name, tp.name as program_name
            FROM workouts w
            LEFT JOIN users u ON w.user_id = u.id
            LEFT JOIN training_programs tp ON w.program_id = tp.id
            WHERE w.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getWorkoutByProgram(programId){
        const result = await pool.query(
            `SELECT w.*, u.full_name as user_name
            FROM workouts w
            LEFT JOIN users u ON w.user_id = u.id
            WHERE w.program_id = $1
            ORDER BY w.start_time DESC`,
            [programId]
        );
        return result.rows;
    }

    static async getWorkoutByDateRange(userId, startDate, endDate){
        const result = await pool.query(
            `SELECT w.*, tp.name as program_name
            FROM workouts w
            LEFT JOIN training_programs tp ON w.program_id = tp.id
            WHERE w.user_id = $1
            AND start_time >= $2
            AND start_time <= $3
            ORDER BY w.start_time DESC`,
            [userId, startDate, endDate]
        );
        return result.rows;
    }

    static async getUserWorkouts(userId){
        const result = await pool.query(
            `SELECT w.*, tp.name as program_name
            FROM workouts w
            LEFT JOIN training_programs tp ON w.program_id = tp.id
            WHERE w.user_id = $1
            ORDER BY w.start_time DESC`,
            [userId]
        );
        return result.rows;
    }

    static async updateWorkout(id, endTime, notes, totalTonnage){
        const result = await pool.query(
            `UPDATE workouts
            SET end_time = $1, notes = $2, total_tonnage = $3
            WHERE id = $4`,
            [endTime, notes, totalTonnage, id]
        );
        return {changes: result.rowCount}
    }

    static async deleteWorkoutById(id){
        const result = await pool.query(
            `DELETE FROM workouts WHERE id = $1`,
            [id]
        );
        return {deleted: result.rowCount}
    }

    static async calculateTotalTonnage(workoutId){
        const result = await pool.query(
            `SELECT COALESCE(SUM(we.exercise_tonnage), 0) as total_tonnage
            FROM workout_exercises we
            WHERE we.workout_id = $1`,
            [workoutId]
        );
        const totalTonnage = result.rows[0].total_tonnage;
        await pool.query(
            `UPDATE workouts SET total_tonnage = $1 WHERE id = $2`,
            [totalTonnage, workoutId]
        );
        return {totalTonnage};
    }
}

module.exports = Workout;