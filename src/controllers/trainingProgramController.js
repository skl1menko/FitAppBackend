const TrainingProgram = require("../models/TrainingProgram");
const User = require("../models/User");
const Workout = require("../models/Workout");
const {pool} = require('../config/database');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {createResponse, successResponse} = require('../utils/responseHandler');
const TrainingProgramDTO = require('../dto/trainingProgram.dto');

//POST /api/programs
const createTrainingProgram = asyncHandler(async (req, res) => {
    const {name, description} = req.body || {};
    const userId = req.user.id;
    
    validateRequired(name, 'Program name');

    const newProgram = await TrainingProgram.createTrainingProgram(name, description || null, userId);
    const program = await TrainingProgram.getTrainingProgramById(newProgram.id);

    return createResponse(res, TrainingProgramDTO.toDetail(program), 'Training program created successfully');
});

//POST /api/programs/with-workouts
const createTrainingProgramWithWorkouts = asyncHandler(async (req, res) => {
    const {name, description, workouts = []} = req.body || {};
    const userId = req.user.id;

    validateRequired(name, 'Program name');

    if (!Array.isArray(workouts)) {
        throw new AppError('Workouts must be an array', 400);
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const programResult = await client.query(
            `INSERT INTO training_programs(name, description, creator_id)
            VALUES($1, $2, $3)
            RETURNING id`,
            [name, description || null, userId]
        );

        const programId = programResult.rows[0].id;

        for (const [index, workout] of workouts.entries()) {
            const workoutName = workout?.name ?? workout?.workoutName ?? null;
            const workoutNotes = workout?.notes ?? null;
            const workoutStartTime = workout?.start_time ?? workout?.startTime ?? null;
            const workoutIsStarted = workout?.is_started !== undefined
                ? Boolean(workout.is_started)
                : false;

            validateRequired(workoutName, `Workout #${index + 1} name`);

            await client.query(
                `INSERT INTO workouts(user_id, program_id, start_time, name, notes, is_started)
                VALUES($1, $2, $3, $4, $5, $6)`,
                [userId, programId, workoutStartTime || null, workoutName, workoutNotes, workoutIsStarted]
            );
        }

        await client.query('COMMIT');

        const program = await TrainingProgram.getTrainingProgramById(programId);
        const createdWorkouts = await Workout.getWorkoutByProgram(programId);

        return createResponse(
            res,
            TrainingProgramDTO.toProgramWithWorkouts(program, createdWorkouts),
            'Training program with workouts created successfully'
        );
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
});

//GET /api/programs
const getAllPrograms = asyncHandler(async (req, res) => {
    const programs = await TrainingProgram.getAllPrograms();
    return successResponse(res, TrainingProgramDTO.toListArray(programs));
});

//GET /api/programs/:id
const getProgramById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const program = await TrainingProgram.getTrainingProgramById(id);

    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    const workouts = await Workout.getWorkoutByProgram(id);
    
    return successResponse(res, TrainingProgramDTO.toProgramWithWorkouts(program, workouts));
});

//GET /api/programs/my-assigned
const getMyAssignedPrograms = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const programs = await TrainingProgram.getAthletePrograms(userId);
    return successResponse(res, TrainingProgramDTO.toListArray(programs));
});

//GET /api/programs/my-created
const getMyCreatedPrograms = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const programs = await TrainingProgram.getProgramByCreator(userId);
    return successResponse(res, TrainingProgramDTO.toListArray(programs));
});

//GET /api/programs/my
const getMyPrograms = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const createdPrograms = await TrainingProgram.getProgramByCreator(userId);
    const assignedPrograms = await TrainingProgram.getAthletePrograms(userId);
    const merged = new Map();

    createdPrograms.forEach((program) => {
        merged.set(program.id, program);
    });

    assignedPrograms.forEach((program) => {
        merged.set(program.id, program);
    });

    return successResponse(res, TrainingProgramDTO.toListArray(Array.from(merged.values())));
});

//POST /api/programs/:id/assign
const assignProgramToAthlete = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {athleteId} = req.body || {};
    const trainerId = req.user.id;
    const userRole = req.user.role;

    validateRequired(athleteId, 'Athlete ID');

    if (userRole !== 'trainer') {
        throw new AppError('Only trainers can assign training programs', 403);
    }

    const program = await TrainingProgram.getTrainingProgramById(id);
    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    const athlete = await User.findUserById(athleteId);
    if (!athlete) {
        throw new AppError('Athlete not found', 404);
    }

    if (athlete.role_name !== 'athlete') {
        throw new AppError('The specified user is not an athlete', 400);
    }

    await TrainingProgram.assignProgramToAthlete(id, athleteId, trainerId);
    
    return createResponse(res, TrainingProgramDTO.toAssignProgram(program, athlete, trainerId), 'Training program assigned to athlete successfully');
});

//PUT /api/programs/:id
const updateTrainingProgram = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, description} = req.body || {};
    const userId = req.user.id;

    validateRequired(name, 'Program name');

    const program = await TrainingProgram.getTrainingProgramById(id);
    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    if (program.creator_id !== userId) {
        throw new AppError('You are not authorized to update this training program', 403);
    }

    await TrainingProgram.updateProgram(id, name, description || null);
    const updatedProgram = await TrainingProgram.getTrainingProgramById(id);
    
    return createResponse(res, TrainingProgramDTO.toDetail(updatedProgram), 'Training program updated successfully');
});

//DELETE /api/programs/:id
const deleteTrainingProgram = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    const program = await TrainingProgram.getTrainingProgramById(id);
    if (!program) {
        throw new AppError('Training program not found', 404);
    }

    if (program.creator_id !== userId) {
        throw new AppError('You are not authorized to delete this training program', 403);
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await Workout.markCompletedWorkoutsFromDeletedPlan(id, client);
        await Workout.deleteIncompleteWorkoutsByProgramId(id, client);
        await client.query(
            `DELETE FROM training_programs WHERE id = $1`,
            [id]
        );
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    return successResponse(res, null, 'Training program deleted successfully');
});

module.exports = {
    createTrainingProgram,
    createTrainingProgramWithWorkouts,
    getAllPrograms,
    getProgramById,
    getMyCreatedPrograms,
    getMyAssignedPrograms,
    getMyPrograms,
    assignProgramToAthlete,
    updateTrainingProgram,
    deleteTrainingProgram
};
