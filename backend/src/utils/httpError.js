// A normal Error that also carries an HTTP status code and a short
// error code, so controllers know what to send back to the client.
//
// Example: throw new HttpError(404, 'SEAT_NOT_FOUND', 'Seat not found.');

class HttpError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}

// Used by controllers: sends the right JSON response for any error.
function sendError(res, error, fallbackMessage) {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            success: false,
            code: error.code,
            message: error.message
        });
    }

    // Unexpected error (bug, database down, ...): log it, hide details.
    console.error(fallbackMessage, error);

    return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: fallbackMessage
    });
}

// Checks that a value is a positive whole number (1, 2, 3, ...).
// Returns the number, or throws a 400 error.
function parseId(value, fieldName) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(
            400,
            'INVALID_INPUT',
            `${fieldName} must be a positive integer.`
        );
    }

    return id;
}

// Optional GPS coordinate. Returns a number, or null when not sent.
// limit: 90 for latitude, 180 for longitude.
function parseCoordinate(value, fieldName, limit) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || Math.abs(number) > limit) {
        throw new HttpError(400, 'INVALID_INPUT', `${fieldName} is not a valid coordinate.`);
    }

    return number;
}

module.exports = {
    HttpError,
    sendError,
    parseId,
    parseCoordinate
};
