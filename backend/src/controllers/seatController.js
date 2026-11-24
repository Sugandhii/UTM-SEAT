const seatService = require('../services/seatService');
const { sendError, parseId } = require('../utils/httpError');

// GET /api/cafeterias/:cafeteriaId/seats
async function getSeatsByCafeteria(req, res) {
    try {
        const cafeteriaId = parseId(req.params.cafeteriaId, 'cafeteriaId');

        const result = await seatService.getSeatsByCafeteria(cafeteriaId);

        res.status(200).json({
            success: true,
            cafeteria: result.cafeteria,
            summary: result.summary,
            data: result.seats
        });
    } catch (error) {
        sendError(res, error, 'Failed to retrieve seat information.');
    }
}

module.exports = {
    getSeatsByCafeteria
};
