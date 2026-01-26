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


module.exports = {
    successResponse,
    createResponse
};