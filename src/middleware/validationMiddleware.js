const validateEmail = (req, res, next) =>{
    const { email } = req.body;

    if(!email){
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email)){
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    next();
};

const validatePassword = (req, res, next) =>{
    const { password } = req.body;
    
    if(!password){
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    
    if(!passwordRegex.test(password)){
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long and include at least one letter and one number'
        });
    }
    next();
};

const validateRegistration = (req, res, next) =>{
    const {email, password, full_name} = req.body;
    const errors = [];

    if(!email){
        errors.push('Email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            errors.push('Invalid email format');
        }
    }

    if(!password){
        errors.push('Password is required');
    } else {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if(!passwordRegex.test(password)){
            errors.push('Password must be at least 8 characters long and include at least one letter and one number');
        }
    }

    if(!full_name || full_name.trim() === ''){
        errors.push('Full name is required');
    }

    if(errors.length > 0){
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors
        });
    }
    next();
};

const validateNumber = (fields) => {
    return (req, res, next) =>{
        const errors = [];

        fields.forEach(field =>{
            const value = req.body[field];

            if(value === undefined || value === null){
                errors.push(`${field} is required`);
            } else if(isNaN(value)){
                errors.push(`${field} must be a number`);
            } else if(Number(value) < 0){
                errors.push(`${field} must be a non-negative number`);
            }
        });

        if(errors.length > 0){
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors
            });
        }
        next();
    };
};

const validateRPE = (req, res, next) =>{
    const { rpe } = req.body;
    
    if(rpe !== undefined && rpe !== null){
        const rpeNum = Number(rpe);

        if(isNaN(rpeNum)){
            return res.status(400).json({
                success: false,
                message: 'RPE must be a number'
            });
        }

        if(rpeNum < 1 || rpeNum > 10){
            return res.status(400).json({
                success: false,
                message: 'RPE must be between 1 and 10'
            });
        }
    }

    next();
};

const validateDate = (field) =>{
    return (req, res, next) =>{
        const dateValue = req.body[field] || req.query[field];

        if(!dateValue){
            return res.status(400).json({
                success: false,
                message: `${field} is required`
            });
        }

        const date = new Date(dateValue);
        
        if(isNaN(date.getTime())){
            return res.status(400).json({
                success: false,
                message: `${field} must be a valid date`
            });
        }

        next();
    }
};

const validateDateRange = (req, res, next) =>{
    const { startDate, endDate } = req.query;
    
    if(!startDate || !endDate){
        return res.status(400).json({
            success: false,
            message: 'startDate and endDate are required'
        });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if(isNaN(start.getTime()) || isNaN(end.getTime())){
        return res.status(400).json({
            success: false,
            message: 'Invalid date format for startDate or endDate'
        });
    }

    if(start > end){
        return res.status(400).json({
            success: false,
            message: 'startDate cannot be later than endDate'
        });
    }

    next();
};

const validateId = (paramName = 'id') =>{
    return (req, res, next) =>{
        const id = req.params[paramName];
        if(!id){
            return res.status(400).json({
                success: false,
                message: `${paramName} is required`
            });
        }

        if(isNaN(id) || Number(id) <= 0){
            return res.status(400).json({
                success: false,
                message: `${paramName} must be a positive number`
            });
        }
        next();
    };
};

const validateWorkoutSet = (req, res, next) =>{
    const { weightKg, reps, rpe } = req.body;
    const errors = [];
    
    if(weightKg === undefined || weightKg === null){
        errors.push('weightKg is required');
    } else if(isNaN(weightKg) || Number(weightKg) < 0){
        errors.push('weightKg must be a non-negative number');
    }

    if(reps === undefined || reps === null){
        errors.push('reps is required');
    } else if(isNaN(reps)|| Number(reps) <= 0){
        errors.push('reps must be a positive integer');
    }

    if(rpe !== undefined && rpe !== null){
        const rpeNum = Number(rpe);
        if(isNaN(rpeNum)){
            errors.push('RPE must be a number');
        } else if(rpeNum < 1 || rpeNum > 10){
            errors.push('RPE must be between 1 and 10');
        }
    }
    
    if(errors.length > 0){
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors
        });
    }
    next();
};

module.exports = {
    validateEmail,
    validatePassword,
    validateRegistration,
    validateNumber,
    validateRPE,
    validateDate,
    validateDateRange,
    validateId,
    validateWorkoutSet
};