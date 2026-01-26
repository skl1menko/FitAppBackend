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


module.exports = {
    validateEmail,
    validatePassword,
    validateRegistration
};