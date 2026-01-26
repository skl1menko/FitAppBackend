class WorkoutSetDTO {
    // Детальна інформація про set
    static toDetail(set) {
        return {
            setId: set.id,
            workoutExerciseId: set.workout_exercise_id,
            weightKg: set.weight_kg,
            reps: set.reps,
            rpe: set.rpe,
            createdAt: set.created_at
        };
    }

    // Масив sets
    static toListArray(sets) {
        return sets.map(s => this.toDetail(s));
    }
}

module.exports = WorkoutSetDTO;
