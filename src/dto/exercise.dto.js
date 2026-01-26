class ExerciseDTO{
    // Компактна версія для списків
    static toList(exercise){
        return{
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscle_group,
            isCustom: exercise.is_custom
        }
    }

    // Детальна версія (для одного запису)
    static toDetail(exercise){
        return{
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscle_group,
            isCustom: exercise.is_custom,
            creatorId: exercise.creator_id,
            description: exercise.description,
            createdAt: exercise.created_at
        }
    }

    static toListArray(exercises){
        return exercises.map(e => this.toList(e));
    }
}

module.exports = ExerciseDTO;