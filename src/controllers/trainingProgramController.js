const TrainingProgram = require("../models/TrainingProgram");
const User = require("../models/User");

//POST /api/programs
const createTrainingProgram = async (req, res) => {
    try {
        const {name, description} = req.body;
        const userId = req.user.id;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Program name is required'
            });
        }

        const newProgram = await TrainingProgram.createTrainingProgram(name, description || null, userId);

        const program = await TrainingProgram.getTrainingProgramById(newProgram.id);

        return res.status(201).json({
            success: true,
            message: 'Training program created successfully',
            data: program
        });
    } catch (error) {
        console.error('Create training program error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create training program',
            error: error.message
        });
    }
};

//GET /api/programs
const getAllPrograms = async (req, res) => {
    try {
        const programs = await TrainingProgram.getAllPrograms();
        
        return res.status(200).json({
            success: true,
            data: programs
        });
    } catch (error) {
        console.error('Get all programs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get training programs',
            error: error.message
        });
    }
};

//GET /api/programs/:id
const getProgramById = async (req, res) => {
    try {
        const {id} = req.params;
        const program = await TrainingProgram.getTrainingProgramById(id);

        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Get program by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get training program',
            error: error.message
        });
    }
};

//GET /api/programs/my-assigned
const getMyAssignedPrograms = async (req, res) => {
    try {
        const userId = req.user.id;
        const programs = await TrainingProgram.getAthletePrograms(userId);
        return res.status(200).json({
            success: true,
            data: programs
        });
    } catch (error) {
        console.error('Get my assigned programs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get assigned training programs',
            error: error.message
        });
    }
};

//POST /api/programs/:id/assign
const assignProgramToAthlete = async (req, res) => {
    try {
        const {id} = req.params;
        const {athleteId} = req.body;
        const trainerId = req.user.id;
        const userRole = req.user.role;

        if (!athleteId) {
            return res.status(400).json({
                success: false,
                message: 'Athlete ID is required'
            });
        }

        if (userRole !== 'trainer') {
            return res.status(403).json({
                success: false,
                message: 'Only trainers can assign training programs'
            });
        }

        const program = await TrainingProgram.getTrainingProgramById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        const athlete = await User.findUserById(athleteId);
        if (!athlete) {
            return res.status(404).json({
                success: false,
                message: 'Athlete not found'
            });
        }

        if (athlete.role_name !== 'athlete') {
            return res.status(400).json({
                success: false,
                message: 'The specified user is not an athlete'
            });
        }

        await TrainingProgram.assignProgramToAthlete(id, athleteId, trainerId);
        
        return res.status(200).json({
            success: true,
            message: 'Training program assigned to athlete successfully',
            data:{
                program_id: id,
                program_name: program.name,
                athlete_id: athleteId,
                athlete_name: athlete.full_name,
                assigned_by: trainerId
            }
        });
    } catch (error) {
        console.error('Assign program to athlete error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign training program to athlete',
            error: error.message
        });
    }
};

//PUT /api/programs/:id
const updateTrainingProgram = async (req, res) => {
    try {
        const {id} = req.params;
        const {name, description} = req.body;
        const userId = req.user.id;

        if (!name || name.trim() ==='') {
            return res.status(400).json({
                success: false,
                message: 'Program name is required'
            });
        }

        const program = await TrainingProgram.getTrainingProgramById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        if (program.creator_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this training program'
            });
        }

        await TrainingProgram.updateProgram(id, name, description || null);

        const updatedProgram = await TrainingProgram.getTrainingProgramById(id);
        
        return res.status(200).json({
            success: true,
            message: 'Training program updated successfully',
            data: updatedProgram
        });

    } catch (error) {
        console.error('Update training program error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update training program',
            error: error.message
        });
    }
};

//DELETE /api/programs/:id
const deleteTrainingProgram = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;

        const program = await TrainingProgram.getTrainingProgramById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        if (program.creator_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this training program'
            });
        }

        await TrainingProgram.deleteProgramById(id);

        return res.status(200).json({
            success: true,
            message: 'Training program deleted successfully'
        });
    } catch (error) {
        console.error('Delete training program error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete training program',
            error: error.message
        });
    }
};

module.exports = {
    createTrainingProgram,
    getAllPrograms,
    getProgramById,
    getMyAssignedPrograms,
    assignProgramToAthlete,
    updateTrainingProgram,
    deleteTrainingProgram
};