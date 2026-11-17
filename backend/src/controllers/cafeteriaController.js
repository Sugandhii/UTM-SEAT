const cafeteriaService = require('../services/cafeteriaService');

async function getAllCafeterias(req, res) {
    try {
        const cafeterias =
            await cafeteriaService.getAllCafeterias();

        res.status(200).json({
            success: true,
            count: cafeterias.length,
            data: cafeterias
        });

    } catch (error) {
        console.error('Error fetching cafeterias:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cafeteria information.'
        });
    }
}

module.exports = {
    getAllCafeterias
};