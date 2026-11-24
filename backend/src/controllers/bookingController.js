const bookingService = require('../services/bookingService');
const { sendError, parseId, parseCoordinate } = require('../utils/httpError');

// -----------------------------------------------------
// TEMPORARY: login (User Management) is not built yet, so the
// student's user_id is sent by the client:
//   - POST requests: in the JSON body  { "user_id": 1, ... }
//   - GET requests:  in the URL        ?user_id=1
//
// When the auth middleware is ready, change ONLY this function to
// read the logged-in user instead, e.g.  return req.user.user_id;
// -----------------------------------------------------
function getCurrentUserId(req) {
    const value = req.body?.user_id ?? req.query.user_id;
    return parseId(value, 'user_id');
}

// POST /api/bookings/hold
async function holdSeat(req, res) {
    try {
        const userId = getCurrentUserId(req);
        const seatId = parseId(req.body?.seat_id, 'seat_id');
        const latitude = parseCoordinate(req.body?.latitude, 'latitude', 90);
        const longitude = parseCoordinate(req.body?.longitude, 'longitude', 180);

        const booking = await bookingService.holdSeat({
            userId,
            seatId,
            latitude,
            longitude
        });

        res.status(201).json({
            success: true,
            message: `Seat held for ${bookingService.HOLD_DURATION_MINUTES} minutes. Please confirm before the time runs out.`,
            data: booking
        });
    } catch (error) {
        sendError(res, error, 'Failed to hold the seat.');
    }
}

// POST /api/bookings/:bookingId/confirm
async function confirmBooking(req, res) {
    try {
        const userId = getCurrentUserId(req);
        const bookingId = parseId(req.params.bookingId, 'bookingId');

        const booking = await bookingService.confirmBooking({ bookingId, userId });

        res.status(200).json({
            success: true,
            message: 'Booking confirmed. Enjoy your meal!',
            data: booking
        });
    } catch (error) {
        sendError(res, error, 'Failed to confirm the booking.');
    }
}

// POST /api/bookings/:bookingId/cancel
async function cancelBooking(req, res) {
    try {
        const userId = getCurrentUserId(req);
        const bookingId = parseId(req.params.bookingId, 'bookingId');

        const booking = await bookingService.cancelBooking({ bookingId, userId });

        res.status(200).json({
            success: true,
            message: 'Booking cancelled.',
            data: booking
        });
    } catch (error) {
        sendError(res, error, 'Failed to cancel the booking.');
    }
}

// GET /api/bookings/active?user_id=1
async function getActiveBooking(req, res) {
    try {
        const userId = getCurrentUserId(req);

        const booking = await bookingService.getActiveBooking(userId);

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        sendError(res, error, 'Failed to retrieve the active booking.');
    }
}

module.exports = {
    holdSeat,
    confirmBooking,
    cancelBooking,
    getActiveBooking
};
