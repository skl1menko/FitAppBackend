class TrainingProgramDTO{
    static toList(program){
        return{
            programId: program.id,
            programName: program.name,
            description: program.description,
            creatorId: program.creator_id,
            creatorName: program.creator_name || null,
            assignedAt: program.assigned_at || null,
            assignedByName: program.assigned_by_name || null,
            isAssigned: Boolean(program.assigned_at),
            assignedAthletesCount: Number(program.assigned_athletes_count) || 0
        }
    }

    static toDetail(program){
        return{
            programId: program.id,
            programName: program.name,
            description: program.description,
            creatorId: program.creator_id,
            creatorName: program.creator_name || null,
            createdAt: program.created_at,
            assignedAt: program.assigned_at || null,
            assignedByName: program.assigned_by_name || null,
            isAssigned: Boolean(program.assigned_at),
            assignedAthletesCount: Number(program.assigned_athletes_count) || 0
        }
    }

    static toProgramWithWorkouts(program, workouts){
        return{
            programId: program.id,
            programName: program.name,
            description: program.description,
            creatorId: program.creator_id,
            creatorName: program.creator_name || null,
            createdAt: program.created_at,
            assignedAt: program.assigned_at || null,
            assignedByName: program.assigned_by_name || null,
            isAssigned: Boolean(program.assigned_at),
            assignedAthletesCount: Number(program.assigned_athletes_count) || 0,
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
