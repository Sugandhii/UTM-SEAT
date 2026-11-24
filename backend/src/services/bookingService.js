const db = require('../config/db');
const { HttpError } = require('../utils/httpError');
const { verifyLocation } = require('./locationService');

// How long a seat stays held before the student must confirm.
// Can be changed in .env (HOLD_DURATION_MINUTES=5).
const HOLD_DURATION_MINUTES = Number(process.env.HOLD_DURATION_MINUTES) || 5;

// Columns returned to the client for a booking.
const BOOKING_COLUMNS = `
    b.booking_id,
    b.user_id,
    b.seat_id,
    s.seat_number,
    s.cafeteria_id,
    c.cafeteria_name,
    b.booking_status,
    b.location_verified,
    b.hold_expires_at,
    TIMESTAMPDIFF(SECOND, NOW(), b.hold_expires_at) AS hold_seconds_left,
    b.created_at,
    b.updated_at
`;

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

// Any hold whose time is over becomes 'released', so the seat is free
// again (FR-10). Called before every seat or booking operation.
async function releaseExpiredHolds(connection = db) {
    await connection.execute(
        `UPDATE bookings
         SET booking_status = 'released'
         WHERE booking_status = 'held'
           AND hold_expires_at <= NOW()`
    );
}

async function findBookingById(bookingId, connection = db) {
    const [rows] = await connection.execute(
        `SELECT ${BOOKING_COLUMNS}
         FROM bookings b
         JOIN seats s ON s.seat_id = b.seat_id
         JOIN cafeterias c ON c.cafeteria_id = s.cafeteria_id
         WHERE b.booking_id = ?`,
        [bookingId]
    );

    return rows[0] || null;
}

function formatBooking(booking) {
    if (!booking) return null;

    const result = {
        ...booking,
        location_verified: Boolean(booking.location_verified)
    };

    // Only a held booking has a countdown.
    if (booking.booking_status === 'held') {
        result.hold_seconds_left = Math.max(0, Number(booking.hold_seconds_left));
    } else {
        delete result.hold_seconds_left;
    }

    return result;
}

// Runs the given work inside a database transaction.
// If anything throws, every change in it is undone (rollback).
async function withTransaction(work) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// -----------------------------------------------------
// 1. HOLD A SEAT  (FR-08, FR-09, FR-12)
// -----------------------------------------------------
async function holdSeat({ userId, seatId, latitude, longitude }) {
    await releaseExpiredHolds();

    return withTransaction(async (connection) => {
        // "FOR UPDATE" locks the user row and the seat row until the
        // transaction ends. If two requests arrive at the same moment,
        // the second one waits, then sees the first one's booking.
        // This is what stops double booking.
        const [users] = await connection.execute(
            'SELECT user_id FROM users WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (users.length === 0) {
            throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
        }

        const [seats] = await connection.execute(
            `SELECT s.seat_id, s.cafeteria_id, s.seat_status, c.is_active
             FROM seats s
             JOIN cafeterias c ON c.cafeteria_id = s.cafeteria_id
             WHERE s.seat_id = ?
             FOR UPDATE`,
            [seatId]
        );

        const seat = seats[0];

        if (!seat || !seat.is_active) {
            throw new HttpError(404, 'SEAT_NOT_FOUND', 'Seat not found.');
        }

        if (seat.seat_status !== 'available') {
            throw new HttpError(409, 'SEAT_NOT_AVAILABLE', 'This seat is not available.');
        }

        // Rule: a student can only have one active booking at a time.
        const [userBookings] = await connection.execute(
            `SELECT booking_id FROM bookings
             WHERE user_id = ?
               AND booking_status IN ('held', 'confirmed')`,
            [userId]
        );

        if (userBookings.length > 0) {
            throw new HttpError(
                409,
                'USER_HAS_ACTIVE_BOOKING',
                'You already have an active booking. Cancel it before booking another seat.'
            );
        }

        // Rule: a seat can only have one active hold or booking.
        const [seatBookings] = await connection.execute(
            `SELECT booking_id FROM bookings
             WHERE seat_id = ?
               AND booking_status IN ('held', 'confirmed')`,
            [seatId]
        );

        if (seatBookings.length > 0) {
            throw new HttpError(409, 'SEAT_NOT_AVAILABLE', 'This seat is already held or booked.');
        }

        // GPS check: throws if the student is outside the cafeteria.
        // Skipped when GEOFENCE_ENABLED=false in .env (development).
        const location = await verifyLocation({
            cafeteriaId: seat.cafeteria_id,
            latitude,
            longitude,
            connection
        });

        const [result] = await connection.execute(
            `INSERT INTO bookings
                (user_id, seat_id, booking_status,
                 gps_latitude, gps_longitude, location_verified, verified_at,
                 hold_expires_at)
             VALUES
                (?, ?, 'held',
                 ?, ?, ?, ${location.verified ? 'NOW()' : 'NULL'},
                 DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [
                userId,
                seatId,
                latitude ?? null,
                longitude ?? null,
                location.verified ? 1 : 0,
                HOLD_DURATION_MINUTES
            ]
        );

        const booking = await findBookingById(result.insertId, connection);
        return formatBooking(booking);
    });
}

// -----------------------------------------------------
// Shared checks for confirm and cancel
// -----------------------------------------------------
async function getOwnBookingForUpdate(connection, bookingId, userId) {
    const [rows] = await connection.execute(
        `SELECT booking_id, user_id, seat_id, booking_status,
                hold_expires_at <= NOW() AS hold_expired
         FROM bookings
         WHERE booking_id = ?
         FOR UPDATE`,
        [bookingId]
    );

    const booking = rows[0];

    if (!booking) {
        throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    }

    // A student may only change their own booking.
    if (booking.user_id !== userId) {
        throw new HttpError(403, 'NOT_YOUR_BOOKING', 'This booking belongs to another user.');
    }

    return booking;
}

// -----------------------------------------------------
// 2. CONFIRM A HELD SEAT  (FR-11)
// -----------------------------------------------------
async function confirmBooking({ bookingId, userId }) {
    return withTransaction(async (connection) => {
        const booking = await getOwnBookingForUpdate(connection, bookingId, userId);

        // The expired hold itself is cleaned up by releaseExpiredHolds().
        if (booking.booking_status === 'held' && booking.hold_expired) {
            throw new HttpError(
                409,
                'HOLD_EXPIRED',
                'The hold time has ended. Please hold the seat again.'
            );
        }

        if (booking.booking_status !== 'held') {
            throw new HttpError(
                409,
                'INVALID_BOOKING_STATUS',
                `Only a held booking can be confirmed. Current status: ${booking.booking_status}.`
            );
        }

        await connection.execute(
            `UPDATE bookings SET booking_status = 'confirmed' WHERE booking_id = ?`,
            [bookingId]
        );

        // Keep the seat table in sync so other modules (admin dashboard)
        // can see that the seat is in use.
        await connection.execute(
            `UPDATE seats SET seat_status = 'occupied' WHERE seat_id = ?`,
            [booking.seat_id]
        );

        return formatBooking(await findBookingById(bookingId, connection));
    });
}

// -----------------------------------------------------
// 3. CANCEL A BOOKING  (FR-13)
// Works for a held seat or a confirmed seat.
// -----------------------------------------------------
async function cancelBooking({ bookingId, userId }) {
    return withTransaction(async (connection) => {
        const booking = await getOwnBookingForUpdate(connection, bookingId, userId);

        if (!['held', 'confirmed'].includes(booking.booking_status)) {
            throw new HttpError(
                409,
                'INVALID_BOOKING_STATUS',
                `This booking cannot be cancelled. Current status: ${booking.booking_status}.`
            );
        }

        await connection.execute(
            `UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = ?`,
            [bookingId]
        );

        if (booking.booking_status === 'confirmed') {
            await connection.execute(
                `UPDATE seats SET seat_status = 'available'
                 WHERE seat_id = ? AND seat_status = 'occupied'`,
                [booking.seat_id]
            );
        }

        return formatBooking(await findBookingById(bookingId, connection));
    });
}

// -----------------------------------------------------
// 4. GET THE STUDENT'S CURRENT BOOKING
// -----------------------------------------------------
async function getActiveBooking(userId) {
    await releaseExpiredHolds();

    const [rows] = await db.execute(
        `SELECT ${BOOKING_COLUMNS}
         FROM bookings b
         JOIN seats s ON s.seat_id = b.seat_id
         JOIN cafeterias c ON c.cafeteria_id = s.cafeteria_id
         WHERE b.user_id = ?
           AND b.booking_status IN ('held', 'confirmed')
         ORDER BY b.created_at DESC
         LIMIT 1`,
        [userId]
    );

    return formatBooking(rows[0] || null);
}

module.exports = {
    HOLD_DURATION_MINUTES,
    releaseExpiredHolds,
    holdSeat,
    confirmBooking,
    cancelBooking,
    getActiveBooking
};
