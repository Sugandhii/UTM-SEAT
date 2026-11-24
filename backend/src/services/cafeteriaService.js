
const db = require('../config/db');

async function getAllCafeterias() {
    const [rows] = await db.execute(`
        SELECT
            c.cafeteria_id,
            c.cafeteria_name,
            c.description,

            CASE
                WHEN COUNT(bs.booth_id) = 0
                    THEN 'unknown'

                WHEN SUM(bs.booth_status = 'open') = COUNT(bs.booth_id)
                    THEN 'open'

                WHEN SUM(bs.booth_status = 'open') > 0
                    THEN 'partially_open'

                WHEN SUM(bs.booth_status = 'unknown') > 0
                    THEN 'unknown'

                ELSE 'closed'
            END AS operating_status,

            COUNT(bs.booth_id) AS total_active_booths,
            SUM(bs.booth_status = 'open') AS open_booths,
            SUM(bs.booth_status = 'closed') AS closed_booths,
            SUM(bs.booth_status = 'unknown') AS unknown_booths

        FROM cafeterias c

        LEFT JOIN (
            SELECT
                b.booth_id,
                b.cafeteria_id,

                CASE
                    WHEN b.status_override = 'open'
                        THEN 'open'

                    WHEN b.status_override IN (
                        'closed', 'temporarily_closed'
                    )
                        THEN 'closed'

                    WHEN boh.booth_id IS NOT NULL THEN
                        CASE
                            WHEN boh.is_closed = TRUE THEN 'closed'
                            WHEN boh.open_time IS NULL
                                OR boh.close_time IS NULL THEN 'unknown'
                            WHEN CURRENT_TIME() >= boh.open_time
                                AND CURRENT_TIME() < boh.close_time
                                THEN 'open'
                            ELSE 'closed'
                        END

                    WHEN coh.cafeteria_id IS NOT NULL THEN
                        CASE
                            WHEN coh.is_closed = TRUE THEN 'closed'
                            WHEN coh.open_time IS NULL
                                OR coh.close_time IS NULL THEN 'unknown'
                            WHEN CURRENT_TIME() >= coh.open_time
                                AND CURRENT_TIME() < coh.close_time
                                THEN 'open'
                            ELSE 'closed'
                        END

                    ELSE 'unknown'
                END AS booth_status

            FROM booths b

            LEFT JOIN booth_operating_hours boh
                ON b.booth_id = boh.booth_id
                AND boh.day_of_week = WEEKDAY(CURRENT_DATE()) + 1

            LEFT JOIN cafeteria_operating_hours coh
                ON b.cafeteria_id = coh.cafeteria_id
                AND coh.day_of_week = WEEKDAY(CURRENT_DATE()) + 1

            WHERE b.is_active = TRUE

        ) bs ON c.cafeteria_id = bs.cafeteria_id

        WHERE c.is_active = TRUE

        GROUP BY
            c.cafeteria_id,
            c.cafeteria_name,
            c.description

        ORDER BY c.cafeteria_name ASC
    `);

    return rows.map(row => ({
    ...row,
    total_active_booths: Number(row.total_active_booths),
    open_booths: Number(row.open_booths ?? 0),
    closed_booths: Number(row.closed_booths ?? 0),
    unknown_booths: Number(row.unknown_booths ?? 0)
}));
}

module.exports = { getAllCafeterias };
