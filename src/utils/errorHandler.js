class AppError extends Error{
    constructor(message, statusCode = 500){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    } 
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';
    
    res.status(statusCode).json({
        status: 'error',
        message: message,
        ...(process.env.NODE_ENV === 'development' && {error: err.message, stack: err.stack})
    });
};

module.exports = {
    AppError,
    asyncHandler,
    errorHandler
};