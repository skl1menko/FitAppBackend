const Exercise = require('../models/Exercise');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {successResponse, createResponse} = require('../utils/responseHandler');

//POST /api/exercises
const createExercise = asyncHandler(async (req, res) => {
    const {name, muscle_group, description, is_custom} = req.body;
    const userId = req.user.id;

    validateRequired(name, 'Name');
    validateRequired(muscle_group, 'Muscle group');

    const isCustom = is_custom !== undefined ? is_custom : true;
    const creatorId = isCustom ? userId : null;

    const newExercise = await Exercise.createExercise(
        name,
        muscle_group,
        isCustom,
        creatorId,
        description
    );

    const exercise = await Exercise.getExerciseById(newExercise.id);

    return createResponse(res, exercise, 'Exercise created successfully');
});

//GET /api/exercises
const getAllExercises = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const allExercises = await Exercise.getAllExercises();

    const filteredExercises = allExercises.filter(exercise =>
        !exercise.is_custom || exercise.creator_id === userId
    );

    return successResponse(res, filteredExercises);
});

//GET /api/exercises/muscle/:group
const getExercisesByMuscleGroup = asyncHandler(async (req, res) => {
    const {group} = req.params;
    const userId = req.user.id;

    const allExercises = await Exercise.getExercisesByMuscleGroup(group);

    const filteredExercises = allExercises.filter(exercise =>
        !exercise.is_custom || exercise.creator_id === userId
    );

    return successResponse(res, filteredExercises);
});

//GET /api/exercises/my
const getMyCustomExercises = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const myExercises = await Exercise.getExerciseByCreator(userId);

    return successResponse(res, myExercises);
});

//GET /api/exercises/:id
const getExerciseById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    const exercise = await Exercise.getExerciseById(id);
    
    if (!exercise) {
        throw new AppError('Exercise not found', 404);
    }

    if (exercise.is_custom && exercise.creator_id !== userId) {
        throw new AppError('Access denied', 403);
    }

    return successResponse(res, exercise);
});

//PUT /api/exercises/:id
const updateExercise = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, muscle_group, description} = req.body;
    const userId = req.user.id;

    validateRequired(name, 'Name');
    validateRequired(muscle_group, 'Muscle group');

    const exercise = await Exercise.getExerciseById(id);
    
    if (!exercise) {
        throw new AppError('Exercise not found', 404);
    }
    
    if (!exercise.is_custom) {
        throw new AppError('Cannot edit system exercises', 403);
    }

    if (exercise.creator_id !== userId) {
        throw new AppError('You can only edit your own custom exercises', 403);
    }

    await Exercise.updateExercise(id, name, muscle_group, description);
    const updatedExercise = await Exercise.getExerciseById(id);

    return successResponse(res, updatedExercise, 'Exercise updated successfully');
});

//DELETE /api/exercises/:id
const deleteExercise = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    const exercise = await Exercise.getExerciseById(id);
    
    if (!exercise) {
        throw new AppError('Exercise not found', 404);
    }

    if (!exercise.is_custom) {
        throw new AppError('Cannot delete system exercises', 403);
    }

    if (exercise.creator_id !== userId) {
        throw new AppError('You can only delete your own custom exercises', 403);
    }

    await Exercise.deleteExerciseById(id);

    return successResponse(res, null, 'Exercise deleted successfully');
});

module.exports = {
    createExercise,
    getAllExercises,
    getExercisesByMuscleGroup,
    getMyCustomExercises,
    getExerciseById,
    updateExercise,
    deleteExercise
};