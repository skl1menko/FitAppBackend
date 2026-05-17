const {pool} = require('../config/database');

class TrainingProgram{
    static async createTrainingProgram(name, description, creatorId){
        const result = await pool.query(`
            INSERT INTO training_programs(name, description, creator_id)
            VALUES($1, $2, $3)
            RETURNING id`,
            [name, description, creatorId]
        );
        return {id:result.rows[0].id};
    }

    static async getTrainingProgramById(id){
        const result = await pool.query(
            `SELECT tp.*,
                    u.full_name as creator_name,
                    COALESCE(COUNT(pa.id), 0) as assigned_athletes_count
            FROM training_programs tp
            LEFT JOIN users u ON tp.creator_id = u.id
            LEFT JOIN program_assignments pa ON pa.program_id = tp.id
            WHERE tp.id = $1
            GROUP BY tp.id, u.full_name`,
            [id]
        );
        return result.rows[0];
    }

    static async getProgramByCreator(creatorId){
        const result = await pool.query(
            `SELECT tp.*,
                    COALESCE(COUNT(pa.id), 0) as assigned_athletes_count
            FROM training_programs tp
            LEFT JOIN program_assignments pa ON pa.program_id = tp.id
            WHERE creator_id = $1
            GROUP BY tp.id
            ORDER BY created_at DESC`,
            [creatorId]
        );
        return result.rows;
    }

    static async getAthletePrograms(athleteId){
        const result = await pool.query(
            `SELECT tp.*, pa.assigned_at, u.full_name as assigned_by_name
            FROM program_assignments pa
            JOIN training_programs tp ON pa.program_id = tp.id
            LEFT JOIN users u ON pa.assigned_by_id = u.id
            WHERE pa.athlete_id = $1
            ORDER BY pa.assigned_at DESC`,
            [athleteId]
        );
        return result.rows;
    }

    static async getProgramAssignment(programId, athleteId){
        const result = await pool.query(
            `SELECT pa.*, u.full_name as assigned_by_name
             FROM program_assignments pa
             LEFT JOIN users u ON pa.assigned_by_id = u.id
             WHERE pa.program_id = $1 AND pa.athlete_id = $2`,
            [programId, athleteId]
        );
        return result.rows[0];
    }

    static async getAllPrograms(){
        const result = await pool.query(
            `SELECT tp.*,
                    u.full_name as creator_name,
                    COALESCE(COUNT(pa.id), 0) as assigned_athletes_count
            FROM training_programs tp
            LEFT JOIN users u ON tp.creator_id = u.id
            LEFT JOIN program_assignments pa ON pa.program_id = tp.id
            GROUP BY tp.id, u.full_name
            ORDER BY tp.created_at DESC`
        );
        return result.rows;
    }

    static async updateProgram(id, name, description){
        const result = await pool.query(
            `UPDATE training_programs
            SET name = $1, description = $2
            WHERE id = $3`,
            [name, description, id]
        );
        return {changes: result.rowCount};
    }

    static async deleteProgramById(id){
        const result = await pool.query(
            `DELETE FROM training_programs WHERE id = $1`,
            [id]
        );
        return {changes: result.rowCount};
    }

    static async assignProgramToAthlete(programId, athleteId, assignedById){
        const result = await pool.query(
            `INSERT INTO program_assignments(program_id, athlete_id, assigned_by_id)
            VALUES($1, $2, $3)
            ON CONFLICT (program_id, athlete_id) DO NOTHING
            RETURNING id`,
            [programId, athleteId, assignedById]
        );
        return {id: result.rows[0]?.id, created: result.rowCount > 0};
    }

    static async unassignProgramFromAthlete(programId, athleteId){
        const result = await pool.query(
            `DELETE FROM program_assignments
            WHERE program_id = $1 AND athlete_id = $2`,
            [programId, athleteId]
        );
        return {removed: result.rowCount};
    }

    static async unassignAllProgramsFromAthleteByTrainer(athleteId, trainerId){
        const result = await pool.query(
            `WITH removed AS (
                DELETE FROM program_assignments pa
                USING training_programs tp
                WHERE pa.program_id = tp.id
                  AND pa.athlete_id = $1
                  AND tp.creator_id = $2
                RETURNING pa.program_id
            )
            SELECT program_id FROM removed`,
            [athleteId, trainerId]
        );
        return result.rows.map((row) => row.program_id);
    }
}

module.exports = TrainingProgram;
