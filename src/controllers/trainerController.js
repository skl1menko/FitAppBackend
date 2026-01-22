const User = require('../models/User');
const Workout = require('../models/Workout');
const BodyMeasurement = require('../models/BodyMeasurement');

//GET /api/trainer/clients
const getClients = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const userRole = req.user.role;
        
        if (userRole !== 'trainer') {
            return res.status(403).json({
                success: false,
                message: 'Only trainers can access client list'
            });
        }
        const clients = await User.getTrainerClients(trainerId);
        return res.status(200).json({
            success: true,
            data: clients
        });

    } catch (error) {
        console.error('Get clients error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get clients',
            error: error.message
        });
    }
};

//POST /api/trainer/clients
const addClient = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const userRole = req.user.role;
        const {email} = req.body;
        
        if (userRole !== 'trainer') {
            return res.status(403).json({
                success: false,
                message: 'Only trainers can assign clients'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Client email is required'
            });
        }

        const client = await User.findUserByEmail(email);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        if (client.role_name !== 'athlete') {
            return res.status(400).json({
                success: false,
                message: 'Only athletes can be assigned as clients'
            });
        }

        if(client.id === trainerId){
            return res.status(400).json({
                success: false,
                message: 'Trainers cannot assign themselves as clients'
            });
        }

        const existingClients = await User.getTrainerClients(trainerId);
        const alreadyAssigned = existingClients.find(c => c.id === client.id);
        if (alreadyAssigned) {
            return res.status(400).json({
                success: false,
                message: 'Client is already assigned to you'
            });
        }
        
        await User.assignClientToTrainer(client.id, trainerId);
        return res.status(200).json({
            success: true,
            message: 'Client successfully assigned',
            data:{
                client_id: client.id,
                client_name: client.full_name,
                client_email: client.email
            }
        });
    } catch (error) {
        console.error('Add client error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign client',
            error: error.message
        });
    }
};

//DELETE /api/trainer/clients/:clientId
const removeClient = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const userRole = req.user.role;
        const {clientId} = req.params;
        
        if (userRole !== 'trainer') {
            return res.status(403).json({
                success: false,
                message: 'Only trainers can remove clients'
            });
        }
        
        const client = await User.findUserById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const clients = await User.getTrainerClients(trainerId);
        const isMyClient = clients.find(c => c.id === parseInt(clientId));
        if (!isMyClient) {
            return res.status(400).json({
                success: false,
                message: 'This client is not assigned to you'
            });
        }

        await User.removeClientFromTrainer(clientId, trainerId);
        return res.status(200).json({
            success: true,
            message: 'Client successfully removed',
            data:{
                client_id: client.id,
                client_name: client.full_name,
                client_email: client.email
            }
        });
    } catch (error) {
        console.error('Remove client error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove client',
            error: error.message
        });
    }
};

//GET /api/trainer/clients/:clientId/workouts
const getClientWorkouts = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const userRole = req.user.role;
        const {clientId} = req.params;
        
        if (userRole !== 'trainer') {
            return res.status(403).json({
                success: false,
                message: 'Only trainers can access client workouts'
            });
        }

        const clients = await User.getTrainerClients(trainerId);
        const isMyClient = clients.find(c => c.id === parseInt(clientId));
        if (!isMyClient) {
            return res.status(400).json({
                success: false,
                message: 'This client is not assigned to you'
            });
        }

        const workouts = await Workout.getUserWorkouts(clientId);
        return res.status(200).json({
            success: true,
            data: {
                client: {
                    id: isMyClient.id,
                    full_name: isMyClient.full_name,
                    email: isMyClient.email
                },
                workouts: workouts
            }
        });
        
    } catch (error) {
        console.error('Get client workouts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get client workouts',
            error: error.message
        });
    }
};

//GET /api/trainer/clients/:clientId/body-measurements
const getClientBodyMeasurements = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const userRole = req.user.role;
        const {clientId} = req.params;
        
        if (userRole !== 'trainer') {
            return res.status(403).json({
                success: false,
                message: 'Only trainers can access client body measurements'
            });
        }
        
        const clients = await User.getTrainerClients(trainerId);
        const isMyClient = clients.find(c => c.id === parseInt(clientId));
        if (!isMyClient) {
            return res.status(400).json({
                success: false,
                message: 'This client is not assigned to you'
            });
        }

        const workouts = await Workout.getUserWorkouts(clientId);
        const latestMeasurement = await BodyMeasurement.getLatestMeasurement(clientId);

        const totalWorkouts = workouts.length;
        const totalTonnage = workouts.reduce((sum, w) => sum + (parseFloat(w.total_tonnage) || 0), 0);

        const recentWorkouts = workouts.slice(0, 5);

        res.status(200).json({
            success: true,
            data: {
                client: {
                    id: isMyClient.id,
                    full_name: isMyClient.full_name,
                    email: isMyClient.email
                },
                statistics: {
                    total_workouts: totalWorkouts,
                    total_tonnage: totalTonnage,
                    avg_tonnage_per_workout: totalWorkouts > 0 ? (totalTonnage / totalWorkouts).toFixed(2) : 0
                },
                latest_body_measurement: latestMeasurement || null,
                recent_workouts: recentWorkouts
            }
        });
    } catch (error) {
        console.error('Get client body measurements error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get client body measurements',
            error: error.message
        });
        
    }
};

module.exports = {
    getClients,
    addClient,
    removeClient,
    getClientWorkouts,
    getClientBodyMeasurements
};