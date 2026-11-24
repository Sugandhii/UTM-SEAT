CREATE DATABASE IF NOT EXISTS utm_seat;

USE utm_seat;

-- TABLE 1: USERS

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(30) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- TABLE 2: CAFETERIAS

CREATE TABLE IF NOT EXISTS cafeterias (
    cafeteria_id INT AUTO_INCREMENT PRIMARY KEY,
    cafeteria_name VARCHAR(100) NOT NULL,
    description TEXT,

    operating_status ENUM(
        'open',
        'closed',
        'temporarily_closed',
        'unknown'
    ) NOT NULL DEFAULT 'unknown',

    latitude DECIMAL(10, 7) DEFAULT NULL,
    longitude DECIMAL(10, 7) DEFAULT NULL,
    geofence_radius INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABLE 2.1: CAFETERIA OPERATING HOURS
-- Default schedule for each cafeteria
-- 1 = Monday, 2 = Tuesday, ..., 7 = Sunday

CREATE TABLE IF NOT EXISTS cafeteria_operating_hours (
    operating_hour_id INT AUTO_INCREMENT PRIMARY KEY,
    cafeteria_id INT NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL,

    open_time TIME DEFAULT NULL,
    close_time TIME DEFAULT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cafeteria_hours
        FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias(cafeteria_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE (cafeteria_id, day_of_week)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS peak_hour_schedules (
    peak_hour_id INT AUTO_INCREMENT PRIMARY KEY,
    cafeteria_id INT NOT NULL,

    day_of_week TINYINT UNSIGNED NOT NULL,
    period_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    description VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_peak_hour_cafeteria
        FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias(cafeteria_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE (cafeteria_id, day_of_week, period_name)
) ENGINE=InnoDB;

-- TABLE: BOOTHS

CREATE TABLE IF NOT EXISTS booths (
    booth_id INT AUTO_INCREMENT PRIMARY KEY,
    cafeteria_id INT NOT NULL,

    booth_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    status_override ENUM(
        'open',
        'closed',
        'temporarily_closed'
    ) DEFAULT NULL,

    override_note VARCHAR(255) DEFAULT NULL,
    override_updated_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_cafeteria
        FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias(cafeteria_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE (cafeteria_id, booth_name)
) ENGINE=InnoDB;

-- TABLE: BOOTH OPERATING HOURS
-- Individual operating schedule for each booth
-- 1 = Monday, 2 = Tuesday, ..., 7 = Sunday

CREATE TABLE IF NOT EXISTS booth_operating_hours (
    operating_hour_id INT AUTO_INCREMENT PRIMARY KEY,
    booth_id INT NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL,

    open_time TIME DEFAULT NULL,
    close_time TIME DEFAULT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booth_hours
        FOREIGN KEY (booth_id)
        REFERENCES booths(booth_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE (booth_id, day_of_week)
) ENGINE=InnoDB;

-- TABLE 3: SEATS

CREATE TABLE IF NOT EXISTS seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    cafeteria_id INT NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    seat_status ENUM(
        'available',
        'occupied',
        'unavailable'
    ) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_seat_cafeteria
        FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias(cafeteria_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE (cafeteria_id, seat_number)
) ENGINE=InnoDB;


-- TABLE 4: BOOKINGS


CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    seat_id INT NOT NULL,

    booking_status ENUM(
        'held',
        'confirmed',
        'cancelled',
        'completed',
        'released'
    ) DEFAULT 'held',

    gps_latitude DECIMAL(10, 7) DEFAULT NULL,
    gps_longitude DECIMAL(10, 7) DEFAULT NULL,
    location_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL DEFAULT NULL,

    hold_expires_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_booking_user (user_id),
    INDEX idx_booking_seat (seat_id),
    INDEX idx_booking_status (booking_status)
) ENGINE=InnoDB;
