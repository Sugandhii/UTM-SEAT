const db = require('../config/db');

// Get all active cafeterias
async function getAllCafeterias() {
    const [rows] = await db.execute(`
        SELECT
            cafeteria_id,
            cafeteria_name,
            description,
            operating_status,
            is_active
        FROM cafeterias
        WHERE is_active = TRUE
        ORDER BY cafeteria_name ASC
    `);

    return rows;
}

module.exports = {
    getAllCafeterias
};