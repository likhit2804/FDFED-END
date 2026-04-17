/**
 * Standardizes parsing of Mongoose Validation and Duplicate Key errors
 * into a client-friendly message.
 * 
 * @param {Error} err The caught error from mongoose/mongodb
 * @param {Object} res The express response object
 * @returns {Object} JSON response with status 400 and extracted message
 */
export const handleMongooseError = (err, res) => {
    let flashMsg;
    if (err.name === "ValidationError") {
        flashMsg = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
    } else if (err.code === 11000) {
        // duplicate key error
        const field = Object.keys(err.keyValue)[0];
        flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
        flashMsg = err.message || "Unexpected error occurred";
    }

    return res.status(400).json({ success: false, message: flashMsg });
};
