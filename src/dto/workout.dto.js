class WorkoutDTO{
    static toList(workout){
        return{
            workoutId: workout.id,
            workoutName: workout.name,
            userId: workout.user_id,
            programId: workout.program_id,
            programName: workout.program_name,
            startTime: workout.start_time,
            endTime: workout.end_time,
            totalTonnage: workout.total_tonnage
        }
    }
    // Детальна версія (без exercises)
    static toDetail(workout){
        return{
            workoutId: workout.id,
            workoutName: workout.name,
            userId: workout.user_id,
            userName: workout.user_name,
            programId: workout.program_id,
            programName: workout.program_name,
            startTime: workout.start_time,
            endTime: workout.end_time,
            totalTonnage: workout.total_tonnage,
            notes: workout.notes,
            createdAt: workout.created_at,
            updatedAt: workout.updated_at
        }
    }

    // Повна версія з exercises
    static toDetailWithExercises(workout, exercises){
        return{
            workoutId: workout.id,
            workoutName: workout.name,
            userId: workout.user_id,
            userName: workout.user_name,
            programId: workout.program_id,
            programName: workout.program_name,
            startTime: workout.start_time,
            endTime: workout.end_time,
            totalTonnage: workout.total_tonnage,
            notes: workout.notes,
            createdAt: workout.created_at,
            updatedAt: workout.updated_at,
            exercisesWithSets: exercises //workoutExerciseDto
        }
    }

    static toListArray(workouts){
        return workouts.map(w => this.toList(w));
    }

}
module.exports = WorkoutDTO;