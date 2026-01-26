const successResponse = (res, data , message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
};

const createResponse = (res, data, message = 'Created successfully') => {
    return successResponse(res, data, message, 201);
};

const noDataResponse = (res, message = 'No content') => {
    return res.status(204).json({
        status: 'success',
        message,
        data: []
    });
};

module.exports = {
    successResponse,
    createResponse,
    noDataResponse
};