const {pool} = require('../config/database');

class Exercise{
    static async createExercise(name,muscleGroup,isCustom,creatorId,description){
        const result = await pool.query(
            `INSERT INTO exercises(name, muscle_group, is_custom, creator_id, description)
            VALUES($1, $2, $3, $4, $5) 
            RETURNING id`,
            [name, muscleGroup, isCustom, creatorId, description]
        );
        return {id: result.rows[0].id};
    }

    static async getExerciseById(id){
        const result = await pool.query(
            `SELECT * FROM exercises WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getExercisesByMuscleGroup(muscleGroup){
        const result = await pool.query(
            `SELECT * FROM exercises WHERE muscle_group = $1
            ORDER BY name`,
            [muscleGroup]
        );
        return result.rows;
    }

    static async getExerciseByCreator(creatorId){
        const result = await pool.query(
            `SELECT * FROM exercises WHERE creator_id = $1
            ORDER BY name`,
            [creatorId]
        );
        return result.rows
    }

    static async getAllExercises(){
        const result = await pool.query(
            `SELECT e.*, u.full_name as creator_name
            FROM exercises e
            LEFT JOIN users u ON e.creator_id = u.id
            ORDER BY e.muscle_group, e.name`
        );
        return result.rows;
    }

    static async updateExercise(id, name, muscleGroup, description){
        const result = await pool.query(
            `UPDATE exercises
            SET name = $1, muscle_group = $2, description = $3
            WHERE id = $4`,
            [name, muscleGroup, description, id]
        );
        return {changes: result.rowCount};
    }

    static async deleteExerciseById(id){
        const result = await pool.query(
            `DELETE FROM exercises WHERE id = $1`,
            [id]
        );
        return {deleted: result.rowCount};
    }   
}

module.exports = Exercise;