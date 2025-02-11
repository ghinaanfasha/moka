const errorHandling = (err, req, res, next) => {
    console.error('Full error object:', err);

    let errorMessage = "Internal Server Error";
    let errors = ["An unexpected error occurred"];

    if (err.name === 'SequelizeValidationError') {
        errorMessage = "Validation Error";
        errors = err.errors.map(e => `${e.path}: ${e.message}`);
    } else if (err.name === 'SequelizeUniqueConstraintError') {
        errorMessage = "Unique Constraint Error";
        errors = err.errors.map(e => `${e.path} must be unique`);
    } else if (err instanceof Error) {
        errorMessage = err.message || "Unknown Error";
        errors = [errorMessage];
    }

    logger.error(errorMessage);

    res.status(500).json({
        errors: errors,
        message: errorMessage,
        data: null,
    });
};

export { errorHandling };