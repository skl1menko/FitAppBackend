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