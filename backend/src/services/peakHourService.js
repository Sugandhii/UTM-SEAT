const db = require('../config/db');

async function getPeakHoursByCafeteria(cafeteriaId) {
    const [rows] = await db.execute(`
        SELECT
            peak_hour_id,
            cafeteria_id,
            day_of_week,
            CASE day_of_week
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
                WHEN 7 THEN 'Sunday'
            END AS day_name,
            period_name,
            start_time,
            end_time,
            CASE
                WHEN day_of_week = WEEKDAY(CURRENT_DATE()) + 1
                    AND CURRENT_TIME() >= start_time
                    AND CURRENT_TIME() < end_time
                THEN TRUE
                ELSE FALSE
            END AS is_current_peak,
            description,
            is_active
        FROM peak_hour_schedules
        WHERE cafeteria_id = ?
          AND is_active = TRUE
        ORDER BY day_of_week, start_time ASC
    `, [cafeteriaId]);

    return rows;
}

module.exports = {
    getPeakHoursByCafeteria
};