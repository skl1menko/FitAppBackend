const {pool} = require('../config/database');

class WorkoutSet{
    static async createWorkoutSet(workoutExerciseId, weightKg, reps, rpe){
        const result = await pool.query(
            `INSERT INTO workout_sets(workout_exercise_id, weight_kg, reps, rpe)
            VALUES($1, $2, $3, $4)
            RETURNING id`,
            [workoutExerciseId, weightKg, reps, rpe]
        );
        return {id: result.rows[0].id};
    }

    static async getSetsByWorkoutExercise(workoutExerciseId){
        const result = await pool.query(
            `SELECT * FROM workout_sets WHERE workout_exercise_id = $1
            ORDER BY id`,
            [workoutExerciseId]
        );
        return result.rows;
    }

    static async updateWorkoutSet(id, weightKg, reps, rpe){
        const result = await pool.query(
            `UPDATE workout_sets
            SET weight_kg = $1, reps = $2, rpe = $3
            WHERE id = $4`,
            [weightKg, reps, rpe, id]
        );
        return {changes: result.rowCount};
    }

    static async deleteWorkoutSetById(id){
        const result = await pool.query(
            `DELETE FROM workout_sets WHERE id = $1`,
            [id]
        );
        return {deleted: result.rowCount};
    }

    static async getAllSetsForWorkout(workoutId){
        const result = await pool.query(
            `SELECT ws.*, we.exercise_id, e.name as exercise_name
            FROM workout_sets ws
            JOIN workout_exercises we ON ws.workout_exercise_id = we.id
            JOIN exercises e ON we.exercise_id = e.id
            WHERE we.workout_id = $1
            ORDER BY we.exercise_order, ws.id`,
            [workoutId]
        );
        return result.rows;
    }

    static async getSetById(id){
        const result = await pool.query(
            `SELECT * FROM workout_sets WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = WorkoutSet;