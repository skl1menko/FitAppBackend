class WorkoutExerciseDTO {
    // Детальна інформація про вправу в тренуванні
    static toDetail(workoutExercise) {
        return {
            id: workoutExercise.id,
            workoutId: workoutExercise.workout_id,
            exerciseId: workoutExercise.exercise_id,
            exerciseName: workoutExercise.exercise_name,
            muscleGroup: workoutExercise.muscle_group,
            orderIndex: workoutExercise.order_index,
            exerciseTonnage: workoutExercise.exercise_tonnage
        };
    }

    // Вправа з sets
    static toDetailWithSets(workoutExercise, sets) {
        return {
            id: workoutExercise.id,
            workoutId: workoutExercise.workout_id,
            exerciseId: workoutExercise.exercise_id,
            exerciseName: workoutExercise.exercise_name,
            muscleGroup: workoutExercise.muscle_group,
            orderIndex: workoutExercise.order_index,
            exerciseTonnage: workoutExercise.exercise_tonnage,
            sets: sets // WorkoutSetDTO.toListArray(sets)
        };
    }

    // Відповідь для оновлення tonnage
    static toTonnageUpdate(workoutId, exerciseId, tonnage) {
        return {
            workoutId: workoutId,
            exerciseId: exerciseId,
            exerciseTonnage: tonnage
        };
    }

    // Масив вправ з sets
    static toListWithSetsArray(exercises) {
        return exercises.map(ex => this.toDetailWithSets(ex, ex.sets));
    }
}

module.exports = WorkoutExerciseDTO;
