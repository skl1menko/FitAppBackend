const BodyMeasurementDTO = require('../dto/bodyMeasurements.dto');
const WorkoutDTO = require('../dto/workout.dto');
class TrainerDTO{
    static toClientInfo(client){
        return{
            clientId: client.id,
            clientName: client.full_name,
            clientEmail: client.email
        }
    }

    static toClientList(clients){
        return clients.map(client => this.toClientInfo(client));
    }

    static toClientAction(client){
        return{
            clientId: client.id,
            clientName: client.full_name,
            clientEmail: client.email
        }
    }

    static toTrainerInfo(trainer){
        if (!trainer) {
            return null;
        }

        return {
            trainerId: trainer.id,
            trainerName: trainer.full_name,
            trainerEmail: trainer.email,
            assignedAt: trainer.assigned_at || null
        };
    }

    static toTrainerList(trainers){
        return trainers.map((trainer) => this.toTrainerInfo(trainer));
    }

    static toAthleteSearchItem(athlete, currentTrainerId){
        const assignedTrainerId = athlete.current_trainer_id || null;
        return {
            clientId: athlete.id,
            clientName: athlete.full_name,
            clientEmail: athlete.email,
            assignedTrainer: assignedTrainerId
                ? {
                    trainerId: assignedTrainerId,
                    trainerName: athlete.current_trainer_name || null
                }
                : null,
            isAssignedToYou: Boolean(assignedTrainerId && Number(assignedTrainerId) === Number(currentTrainerId))
        };
    }

    static toAthleteSearchList(athletes, currentTrainerId){
        return athletes.map((athlete) => this.toAthleteSearchItem(athlete, currentTrainerId));
    }

    static toConnectionRequest(request){
        return {
            athlete: {
                athleteId: request.athlete_id,
                athleteName: request.athlete_name,
                athleteEmail: request.athlete_email
            },
            trainer: {
                trainerId: request.trainer_id,
                trainerName: request.trainer_name,
                trainerEmail: request.trainer_email
            },
            requestedByRole: request.requested_by_role,
            createdAt: request.created_at
        };
    }

    static toConnectionRequestList(requests){
        return requests.map((request) => this.toConnectionRequest(request));
    }

    static toClientWorkouts(client, workouts){
        return{
            client:{
                clientId: client.id,
                clientName: client.full_name,
                clientEmail: client.email
            },
            workouts: workouts.map(w => WorkoutDTO.toDetail(w)) //workoutDTO
        }
    }

    static toClientStatistics(client, statistics, latestMeasurement, recentWorkouts){
        return{
            client:{
                clientId: client.id,
                clientName: client.full_name,
                clientEmail: client.email
            },
            statistics:{
                totalWorkouts: statistics.total_workouts,
                totalTonnage: statistics.total_tonnage,
                avgTonnagePerWorkout: statistics.avg_tonnage_per_workout
            },
            latestMeasurement: BodyMeasurementDTO.toDetail(latestMeasurement), //bodyMeasurementDTO
            recentWorkouts: recentWorkouts.map(w => WorkoutDTO.toDetail(w)) //workoutDTO array
        }
    }
}
module.exports = TrainerDTO;
