const locationService = require('../services/locationService');
const { sendError, parseId, parseCoordinate } = require('../utils/httpError');

// POST /api/cafeterias/:cafeteriaId/verify-location
// Body: { "latitude": 1.5582, "longitude": 103.639 }
//
// Tells the app whether the student is inside the cafeteria area,
// so it can enable or disable the booking buttons.
async function verifyLocation(req, res) {
    try {
        const cafeteriaId = parseId(req.params.cafeteriaId, 'cafeteriaId');
        const latitude = parseCoordinate(req.body?.latitude, 'latitude', 90);
        const longitude = parseCoordinate(req.body?.longitude, 'longitude', 180);

        const result = await locationService.checkLocation({
            cafeteriaId,
            latitude,
            longitude
        });

        const geofenceEnabled = locationService.GEOFENCE_ENABLED;

        res.status(200).json({
            success: true,
            message: result.within_geofence
                ? `You are inside ${result.cafeteria_name}.`
                : `You are ${result.distance_meters} m away from ${result.cafeteria_name}.`,
            data: {
                ...result,
                geofence_enabled: geofenceEnabled,
                // Booking is allowed when inside, or when the check is off.
                can_book: result.within_geofence || !geofenceEnabled
            }
        });
    } catch (error) {
        sendError(res, error, 'Failed to verify location.');
    }
}

module.exports = {
    verifyLocation
};
