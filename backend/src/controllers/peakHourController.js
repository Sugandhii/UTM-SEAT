
const peakHourService = require('../services/peakHourService');

async function getPeakHoursByCafeteria(req, res) {
    const cafeteriaId = Number(req.params.id);

    // Validate cafeteria ID
    if (!Number.isInteger(cafeteriaId) || cafeteriaId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cafeteria ID.'
        });
    }

    try {
        const peakHours =
            await peakHourService.getPeakHoursByCafeteria(cafeteriaId);

        return res.status(200).json({
            success: true,
            cafeteria_id: cafeteriaId,
            count: peakHours.length,
            data: peakHours
        });

    } catch (error) {
        console.error('Error fetching peak hours:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve peak-hour information.'
        });
    }
}

module.exports = {
    getPeakHoursByCafeteria
};
