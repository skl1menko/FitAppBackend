const {AppError} = require('../utils/errorHandler');

const validatePositiveNumber = (value, fieldName) => {
    if (value !== undefined && value !== null) {
        if (isNaN(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive number`, 400);
        }
    }
};

const validateRange = (value, fieldName, min, max) => {
    if (value !== undefined && value !== null) {
        if (isNaN(value) || value < min || value > max) {
            throw new AppError(`${fieldName} must be between ${min} and ${max}`, 400);
        }
    }
};

const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        throw new AppError(`${fieldName} is required`, 400);
    }
};

const validateNumericFields = (fields) => {
    for (const [field,value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
            validatePositiveNumber(value, field);
        }
    }
};

module.exports = {
    validatePositiveNumber,
    validateRange,
    validateRequired,
    validateNumericFields
};