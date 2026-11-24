// =====================================================
// GPS GEOFENCING & LOCATION VERIFICATION  (PB-03 / IMP-03)
// =====================================================
//
// A "geofence" is a circle around a cafeteria:
//   centre = cafeterias.latitude, cafeterias.longitude
//   radius = cafeterias.geofence_radius (metres)
// A student may book a seat only when their device is inside it.
//
// Development switch (.env):
//   GEOFENCE_ENABLED=false  -> booking skips the location check, so you
//                              can test from home. The verify endpoint
//                              still calculates the distance.
//   GEOFENCE_ENABLED=true   -> location is required (default).
//
// Limitation: GPS is an eligibility check, not proof of presence.
// Indoor signals can be inaccurate and locations can be faked.

const db = require('../config/db');
const { HttpError } = require('../utils/httpError');

const GEOFENCE_ENABLED = process.env.GEOFENCE_ENABLED !== 'false';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

// Straight-line distance between two GPS points, in metres
// (Haversine formula: distance along the surface of the earth).
function distanceInMeters(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

// Checks whether a point is inside a cafeteria's geofence.
// Always calculates, whatever GEOFENCE_ENABLED says.
async function checkLocation({ cafeteriaId, latitude, longitude, connection = db }) {
    if (latitude === null || longitude === null) {
        throw new HttpError(
            400,
            'LOCATION_REQUIRED',
            'Location is required. Please allow location access and try again.'
        );
    }

    const [rows] = await connection.execute(
        `SELECT cafeteria_id, cafeteria_name, latitude, longitude, geofence_radius
         FROM cafeterias
         WHERE cafeteria_id = ? AND is_active = TRUE`,
        [cafeteriaId]
    );

    const cafeteria = rows[0];

    if (!cafeteria) {
        throw new HttpError(404, 'CAFETERIA_NOT_FOUND', 'Cafeteria not found.');
    }

    if (cafeteria.latitude === null || cafeteria.longitude === null) {
        throw new HttpError(
            409,
            'GEOFENCE_NOT_CONFIGURED',
            'This cafeteria has no location set yet. Please contact the administrator.'
        );
    }

    const distance = distanceInMeters(
        latitude,
        longitude,
        Number(cafeteria.latitude),
        Number(cafeteria.longitude)
    );

    const radius = Number(cafeteria.geofence_radius);

    return {
        cafeteria_id: cafeteria.cafeteria_id,
        cafeteria_name: cafeteria.cafeteria_name,
        within_geofence: distance <= radius,
        distance_meters: Math.round(distance),
        geofence_radius_meters: radius
    };
}

// Called by the booking code before a seat is held.
// Returns { verified: true } or throws when the student is outside.
async function verifyLocation({ cafeteriaId, latitude, longitude, connection = db }) {
    if (!GEOFENCE_ENABLED) {
        return { verified: false, skipped: true };
    }

    const result = await checkLocation({ cafeteriaId, latitude, longitude, connection });

    if (!result.within_geofence) {
        throw new HttpError(
            403,
            'LOCATION_NOT_VERIFIED',
            `You are ${result.distance_meters} m from ${result.cafeteria_name}. ` +
            `You must be within ${result.geofence_radius_meters} m to book a seat.`
        );
    }

    return { verified: true };
}

module.exports = {
    GEOFENCE_ENABLED,
    distanceInMeters,
    checkLocation,
    verifyLocation
};
