class TrainingProgramDTO{
    static toList(program){
        return{
            programId: program.id,
            programName: program.name,
            description: program.description,
            creatorId: program.creator_id,
        }
    }

    static toDetail(program){
        return{
            programId: program.id,
            programName: program.name,
            description: program.description,
            creatorId: program.creator_id,
            createdAt: program.created_at
        }
    }

    static toProgramWithWorkouts(program, workouts){
        return{
            programId: program.id,
            programName: program.name,
            description: program.description,
            creatorId: program.creator_id,
            createdAt: program.created_at,
            workouts: workouts
        }
    }

    static toAssignProgram(program, athlete, trainerId){
        return{
            programId: program.id,
            programName: program.name,
            athleteId: athlete.id,
            athleteName: athlete.full_name,
            assignedBy: trainerId
        }
    }
    
    static toListArray(programs){
        return programs.map(p => this.toList(p));
    }
}

module.exports = TrainingProgramDTO;