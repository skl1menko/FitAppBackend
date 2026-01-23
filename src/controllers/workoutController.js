const Workout = require("../models/Workout");

//POST /api/workouts
const createWorkout = async (req, res) => {
    try{
        const {program_id, notes} = req.body;
        const userId = req.user.id;
        const startTime = new Date();

        const newWorkout = await Workout.createWorkout(
            userId,
            program_id || null,
            startTime,
            notes|| null
        );

        const workout = await Workout.getWorkoutById(newWorkout.id);
        
        return res.status(201).json({
            success: true,
            message: 'Workout created successfully',
            data: workout
        });

    } catch(error){
        console.error('Create workout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create workout',
            error: error.message
        });
    }
};

//GET /api/workouts

const getMyWorkouts = async (req, res) => {
    try {
        const userId = req.user.id;
        const workouts = await Workout.getUserWorkouts(userId);
        return res.status(200).json({
            success: true,
            data: workouts
        });
    } catch (error) {
        console.error('Get workouts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get workouts',
            error: error.message
        });
    }
};

//GET /api/workouts/:id
const getWorkoutById = async (req, res) => {
    try {
        const {id} = req.params;
        const workout = await Workout.getWorkoutById(id);
        const userId = req.user.id;

        if(!workout){
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        if(workout.user_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: workout
        });

        
    } catch (error) {
        console.error('Get workout by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve workout',
            error: error.message
        });
    }
};

//GET /api/workouts/range?startDate=&endDate=
const getWorkoutByDateRange = async (req, res) =>{
    try {
        const {start, end} = req.query;
        const userId = req.user.id;

        if(!start || !end){
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const workout = await Workout.getWorkoutByDateRange(userId, startDate, endDate);

        res.status(200).json({
            success: true,
            data: workout
        });

    } catch (error) {
        console.error('Get workouts by date range error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get workouts by date range',
            error: error.message
        });
    }
};

//PUT /api/workouts/:id
const updateWorkout = async (req, res) => {
    try {
        const {id} = req.params;
        const {notes, end_time} = req.body;
        const userId = req.user.id;

        const workout = await Workout.getWorkoutById(id);
        
        if(!workout){
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        if(workout.user_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const endTime = end_time ? new Date(end_time) : new Date();

        const {totalTonnage} = await Workout.calculateTotalTonnage(id);

        await Workout.updateWorkout(id, endTime, notes, totalTonnage);

        const updatedWorkout = await Workout.getWorkoutById(id);
        
        res.status(200).json({
            success: true,
            message: 'Workout updated successfully',
            data: updatedWorkout
        });
        
    } catch (error) {
        console.error('Update workout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update workout',
            error: error.message
        });
    }
};

//DELETE /api/workouts/:id
const deleteWorkout = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;
        
        const workout = await Workout.getWorkoutById(id);
        if(!workout){
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }
        
        if(workout.user_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        await Workout.deleteWorkoutById(id);
        
        res.status(200).json({
            success: true,
            message: 'Workout deleted successfully'
        });
    } catch (error) {
        console.error('Delete workout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete workout',
            error: error.message
        });
    }
};

//POST /api/workouts/:id/calculate
const calculateWorkoutTonnage = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;
        
        const workout = await Workout.getWorkoutById(id);
        if(!workout){
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        if(workout.user_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const {totalTonnage} = await Workout.calculateTotalTonnage(id);

        const updatedWorkout = await Workout.getWorkoutById(id);
        
        res.status(200).json({
            success: true,
            message: 'Workout tonnage calculated successfully',
            data: updatedWorkout
        });
    } catch (error) {
        console.error('Calculate workout tonnage error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate workout tonnage',
            error: error.message
        });
    }
};

module.exports = {
    createWorkout,
    getMyWorkouts,
    getWorkoutById,
    getWorkoutByDateRange,
    updateWorkout,
    deleteWorkout,
    calculateWorkoutTonnage
};