const {pool} = require('../config/database');

class WorkoutExercise{
    static async addExerciseToWorkout(workoutId, exerciseId, exerciseOrder){
        const result = await pool.query(
            `INSERT INTO workout_exercises(workout_id, exercise_id, exercise_order)
            VALUES($1, $2, $3)
            RETURNING id`,
            [workoutId, exerciseId, exerciseOrder]
        );
        return {id: result.rows[0].id};
    }

    static async getExercisesByWorkoutId(workoutId){
        const result = await pool.query(
            `SELECT we.*, e.name as exercise_name, e.muscle_group
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            WHERE we.workout_id = $1
            ORDER BY we.exercise_order`,
            [workoutId]
        );
        return result.rows;
    }

    static async updateExerciseTonnage(id, tonnage){
        const result = await pool.query(
            `UPDATE workout_exercises
            SET exercise_tonnage = $1
            WHERE id = $2`,
            [tonnage, id]
        );
        return {changes: result.rowCount};
    }

    static async deleteExercisesByWorkoutId(workoutId){
        const result = await pool.query(
            `DELETE FROM workout_exercises WHERE workout_id = $1`,
            [workoutId]
        );
        return {deleted: result.rowCount};
    }

    static async reorderExercise(workoutId, exerciseOrder){
        const client = await pool.connect();
        try{
            await client.query('BEGIN');
            for(let i = 0; i < exerciseOrder.length; i++){
                await client.query(
                    `UPDATE workout_exercises
                    SET exercise_order = $1
                    WHERE id = $2 AND workout_id = $3`,
                    [i + 1, exerciseOrder[i], workoutId]
                );
            }
            await client.query('COMMIT');
            return {success: true};
        } catch(error){
            await client.query('ROLLBACK');
            throw error;
        } finally{
            client.release();
        }
    }

    static async calculateExerciseTonnage(workoutExerciseId){
        const result = await pool.query(
            `SELECT COALESCE(SUM(weight_kg * reps), 0) as exercise_tonnage
            FROM workout_sets
            WHERE workout_exercise_id = $1`,
            [workoutExerciseId]
        );
        const exerciseTonnage = result.rows[0].exercise_tonnage;
        await pool.query(
            `UPDATE workout_exercises
            SET exercise_tonnage = $1
            WHERE id = $2`,
            [exerciseTonnage, workoutExerciseId]
        );
        return {exerciseTonnage};
    }
}

module.exports = WorkoutExercise;