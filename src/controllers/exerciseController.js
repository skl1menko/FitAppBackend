const Exercise = require('../models/Exercise');

//POST /api/exercises

const createExercise = async (req, res) =>{
 try{
    const {name, muscle_group, description, is_custom} = req.body;
    const userId = req.user.id;

    if(!name || !muscle_group){
        return res.status(400).json({
            success: false,
            message: 'Name and muscle group are required'
        });
    }

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

    return res.status(201).json({
        success: true,
        message: 'Exercise created successfully',
        data: exercise
    });

 } catch(err){
    console.error('Create exercise error:', err);
    return res.status(500).json({
        success: false,
        message: 'Failed to create exercise',
        error: err.message
    });
 }
};

//GET /api/exercises

const getAllExercises = async (req, res) =>{
    try{
        const userId = req.user.id;
        const allExercises = await Exercise.getAllExercises();

        const filteredExercises = allExercises.filter(exercise =>
            !exercise.is_custom || exercise.creator_id === userId
        );

         res.status(200).json({
            success: true,
            data: filteredExercises
        });
    } catch(err){
        console.error('Get all exercises error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve exercises',
            error: err.message
        });
    }
};

//GET /api/exercises/muscle/:group
const getExercisesByMuscleGroup = async (req, res) =>{
    try{
        const {group} = req.params;
        const userId = req.user.id;

        const allExercises = await Exercise.getExercisesByMuscleGroup(group);

        const filteredExercises = allExercises.filter(exercise =>
            !exercise.is_custom || exercise.creator_id === userId
        );

        res.status(200).json({
            success: true,
            data: filteredExercises
        });
    } catch(err){
        console.error('Get exercises by muscle group error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve exercises by muscle group',
            error: err.message
        });
    }
};

//GET /api/exercises/my
const getMyCustomExercises = async (req, res) =>{
    try{
        const userId = req.user.id;
        
        const myExercises = await Exercise.getExerciseByCreator(userId);

        res.status(200).json({
            success: true,
            data: myExercises
        });
    } catch(err){
        console.error('Get my custom exercises error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve your custom exercises',
            error: err.message
        });
    }
};

//GET /api/exercises/:id
const getExerciseById = async (req, res) =>{
    try{
        const {id} = req.params;
        const userId = req.user.id;

        const exercise = await Exercise.getExerciseById(id);
        
        if(!exercise){
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        if(exercise.is_custom && exercise.creator_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: exercise
        });
    } catch(err){
        console.error('Get exercise by id error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve exercise',
            error: err.message
        });
    }
};

//PUT /api/exercises/:id
const updateExercise = async (req, res)=>{
    try{
        const {id} = req.params;
        const {name, muscle_group, description} = req.body;
        const userId = req.user.id;

        // Перевірка, чи існує вправа
        const exercise = await Exercise.getExerciseById(id);
        if(!exercise){
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }
        
        // Не можна редагувати системні вправи
        if(!exercise.is_custom){
            return res.status(403).json({
                success: false,
                message: 'Cannot edit system exercises'
            });
        }

        // Перевірка прав доступу - тільки власник
        if(exercise.creator_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own custom exercises'
            });
        }

        if(!name || !muscle_group){
            return res.status(400).json({
                success: false,
                message: 'Name and muscle group are required'
            });
        }

        await Exercise.updateExercise(id, name, muscle_group, description);

        const updatedExercise = await Exercise.getExerciseById(id);

        res.status(200).json({
            success: true,
            message: 'Exercise updated successfully',
            data: updatedExercise
        });
    } catch(err){
        console.error('Update exercise error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update exercise',
            error: err.message
        });
    }
};

//DELETE /api/exercises/:id
const deleteExercise = async (req, res) =>{
    try{
        const {id} = req.params;
        const userId = req.user.id;

        const exercise = await Exercise.getExerciseById(id);
        if(!exercise){
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Не можна видаляти системні вправи
        if(!exercise.is_custom){
            return res.status(403).json({
                success: false,
                message: 'Cannot delete system exercises'
            });
        }

        // Перевірка прав доступу - тільки власник
        if(exercise.creator_id !== userId){
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own custom exercises'
            });
        }

        await Exercise.deleteExerciseById(id);

        res.status(200).json({
            success: true,
            message: 'Exercise deleted successfully'
        });

    } catch(err){
        console.error('Delete exercise error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete exercise',
            error: err.message
        });
    }
};

module.exports = {
    createExercise,
    getAllExercises,
    getExercisesByMuscleGroup,
    getMyCustomExercises,
    getExerciseById,
    updateExercise,
    deleteExercise
};