-- =====================================================
-- UTM SE&AT - SAMPLE DATA (SEED)
-- Run this AFTER schema.sql.
-- Safe to run more than once: INSERT IGNORE skips rows
-- that already exist.
-- =====================================================

USE utm_seat;

-- -----------------------------------------------------
-- TEST USERS
-- Password for all test accounts: password123
-- (temporary, until the User Management module is ready)
-- -----------------------------------------------------

INSERT IGNORE INTO users (user_id, student_id, full_name, email, password_hash, role) VALUES
(1, 'A24CS0001', 'Test Student One', 'student1@graduate.utm.my',
    '$2b$10$0bA5LyWXdF4rxudE37h60OyO7RgKD39wejZXF8/EuxBEk1FBhqUKa', 'student'),
(2, 'A24CS0002', 'Test Student Two', 'student2@graduate.utm.my',
    '$2b$10$0bA5LyWXdF4rxudE37h60OyO7RgKD39wejZXF8/EuxBEk1FBhqUKa', 'student'),
(3, NULL, 'Test Admin', 'admin@utm.my',
    '$2b$10$0bA5LyWXdF4rxudE37h60OyO7RgKD39wejZXF8/EuxBEk1FBhqUKa', 'admin');

-- -----------------------------------------------------
-- CAFETERIAS
-- NOTE: coordinates are approximate placeholders.
-- The GPS geofencing owner should replace them with
-- the real location of each cafeteria.
-- -----------------------------------------------------

INSERT IGNORE INTO cafeterias (cafeteria_id, cafeteria_name, description, latitude, longitude, geofence_radius, is_active) VALUES
(1, 'Arked Meranti', 'Sample cafeteria (test data)', 1.5582000, 103.6390000, 100, TRUE),
(2, 'Arked Cengal',  'Sample cafeteria (test data)', 1.5605000, 103.6340000, 100, TRUE),
(3, 'Arked Lestari', 'Sample cafeteria (test data)', 1.5625000, 103.6300000, 100, TRUE);

-- -----------------------------------------------------
-- SEATS
-- -----------------------------------------------------

-- Arked Meranti: 12 seats (M01 - M12)
INSERT IGNORE INTO seats (cafeteria_id, seat_number, seat_status) VALUES
(1, 'M01', 'available'), (1, 'M02', 'available'), (1, 'M03', 'available'),
(1, 'M04', 'available'), (1, 'M05', 'available'), (1, 'M06', 'available'),
(1, 'M07', 'available'), (1, 'M08', 'available'), (1, 'M09', 'available'),
(1, 'M10', 'available'), (1, 'M11', 'available'), (1, 'M12', 'unavailable');

-- Arked Cengal: 8 seats (C01 - C08)
INSERT IGNORE INTO seats (cafeteria_id, seat_number, seat_status) VALUES
(2, 'C01', 'available'), (2, 'C02', 'available'), (2, 'C03', 'available'),
(2, 'C04', 'available'), (2, 'C05', 'available'), (2, 'C06', 'available'),
(2, 'C07', 'available'), (2, 'C08', 'available');

-- Arked Lestari: 6 seats (L01 - L06)
INSERT IGNORE INTO seats (cafeteria_id, seat_number, seat_status) VALUES
(3, 'L01', 'available'), (3, 'L02', 'available'), (3, 'L03', 'available'),
(3, 'L04', 'available'), (3, 'L05', 'available'), (3, 'L06', 'available');
