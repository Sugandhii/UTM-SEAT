const db = require('../config/db');
const { HttpError } = require('../utils/httpError');
const { releaseExpiredHolds } = require('./bookingService');

// Turns the raw database values into one status the app can show.
//
//   unavailable : admin marked the seat as not usable
//   occupied    : a booking is confirmed (student is sitting there)
//   held        : someone is holding it and has not confirmed yet
//   available   : free to book
function getDisplayStatus(row) {
    if (row.seat_status === 'unavailable') return 'unavailable';
    if (row.booking_status === 'confirmed') return 'occupied';
    if (row.booking_status === 'held') return 'held';
    if (row.seat_status === 'occupied') return 'occupied';
    return 'available';
}

// Get all seats of one cafeteria, with their status and a summary.
async function getSeatsByCafeteria(cafeteriaId) {
    // Free up holds whose time is over, so they show as available.
    await releaseExpiredHolds();

    const [cafeterias] = await db.execute(
        `SELECT cafeteria_id, cafeteria_name
         FROM cafeterias
         WHERE cafeteria_id = ? AND is_active = TRUE`,
        [cafeteriaId]
    );

    if (cafeterias.length === 0) {
        throw new HttpError(404, 'CAFETERIA_NOT_FOUND', 'Cafeteria not found.');
    }

    // LEFT JOIN: every seat appears once. If the seat has an active
    // booking (confirmed, or held and not expired) its info is attached.
    const [rows] = await db.execute(
        `SELECT
            s.seat_id,
            s.seat_number,
            s.seat_status,
            b.booking_status,
            TIMESTAMPDIFF(SECOND, NOW(), b.hold_expires_at) AS hold_seconds_left
         FROM seats s
         LEFT JOIN bookings b
            ON b.seat_id = s.seat_id
            AND (
                b.booking_status = 'confirmed'
                OR (b.booking_status = 'held' AND b.hold_expires_at > NOW())
            )
         WHERE s.cafeteria_id = ?
         ORDER BY LENGTH(s.seat_number), s.seat_number`,
        [cafeteriaId]
    );

    const summary = {
        total: rows.length,
        available: 0,
        held: 0,
        occupied: 0,
        unavailable: 0
    };

    const seats = rows.map((row) => {
        const status = getDisplayStatus(row);
        summary[status] += 1;

        const seat = {
            seat_id: row.seat_id,
            seat_number: row.seat_number,
            status
        };

        if (status === 'held') {
            seat.hold_seconds_left = Number(row.hold_seconds_left);
        }

        return seat;
    });

    return {
        cafeteria: cafeterias[0],
        summary,
        seats
    };
}

module.exports = {
    getSeatsByCafeteria
};
