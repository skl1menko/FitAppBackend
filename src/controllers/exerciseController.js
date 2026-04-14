const Exercise = require('../models/Exercise');
const {asyncHandler, AppError} = require('../utils/errorHandler');
const {validateRequired} = require('../utils/validator');
const {successResponse, createResponse} = require('../utils/responseHandler');
const ExerciseDTO = require('../dto/exercise.dto');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const extractCloudinaryPublicId = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;

    try {
        const parsed = new URL(imageUrl);
        if (!parsed.hostname.includes('res.cloudinary.com')) return null;

        // Example pathname:
        // /<cloud>/image/upload/v1234567890/folder/name.webp
        const uploadMarker = '/image/upload/';
        const markerIndex = parsed.pathname.indexOf(uploadMarker);
        if (markerIndex === -1) return null;

        const afterUpload = parsed.pathname.slice(markerIndex + uploadMarker.length);
        const withoutVersion = afterUpload.replace(/^v\d+\//, '');
        const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, '');

        return decodeURIComponent(withoutExtension);
    } catch {
        return null;
    }
};

//POST /api/exercises
const createExercise = asyncHandler(async (req, res) => {
    const {name, muscle_group, description, image_url, is_custom} = req.body;
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
        description,
        image_url
    );

    const exercise = await Exercise.getExerciseById(newExercise.id);

    return createResponse(res, ExerciseDTO.toDetail(exercise), 'Exercise created successfully');
});

//GET /api/exercises
const getAllExercises = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const allExercises = await Exercise.getAllExercises();

    const filteredExercises = allExercises.filter(exercise =>
        !exercise.is_custom || exercise.creator_id === userId
    );

    return successResponse(res, ExerciseDTO.toListArray(filteredExercises));
});

//GET /api/exercises/muscle/:group
const getExercisesByMuscleGroup = asyncHandler(async (req, res) => {
    const {group} = req.params;
    const userId = req.user.id;

    const allExercises = await Exercise.getExercisesByMuscleGroup(group);

    const filteredExercises = allExercises.filter(exercise =>
        !exercise.is_custom || exercise.creator_id === userId
    );

    return successResponse(res, ExerciseDTO.toListArray(filteredExercises));
});

//GET /api/exercises/my
const getMyCustomExercises = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const myExercises = await Exercise.getExerciseByCreator(userId);

    return successResponse(res, ExerciseDTO.toListArray(myExercises));
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

    return successResponse(res, ExerciseDTO.toDetail(exercise));
});

//PUT /api/exercises/:id
const updateExercise = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, muscle_group, description, image_url} = req.body;
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

    await Exercise.updateExercise(id, name, muscle_group, description, image_url);
    const updatedExercise = await Exercise.getExerciseById(id);

    return successResponse(res, ExerciseDTO.toDetail(updatedExercise), 'Exercise updated successfully');
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

    const publicId = extractCloudinaryPublicId(exercise.image_url);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (error) {
            // Do not block exercise deletion if Cloudinary cleanup fails.
            console.warn('Cloudinary delete failed for public_id:', publicId, error?.message);
        }
    }

    await Exercise.deleteExerciseById(id);

    return successResponse(res, null, 'Exercise deleted successfully');
});

//POST /api/exercises/upload-image
const uploadExerciseImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('Image file is required', 400);
    }

    const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'fitapp/exercises',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    return successResponse(res, {
        imageUrl: uploadResult.secure_url
    }, 'Image uploaded successfully');
});

module.exports = {
    createExercise,
    getAllExercises,
    getExercisesByMuscleGroup,
    getMyCustomExercises,
    getExerciseById,
    updateExercise,
    deleteExercise,
    uploadExerciseImage
};