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
    latitude DECIMAL(10, 7) DEFAULT NULL,
    longitude DECIMAL(10, 7) DEFAULT NULL,
    geofence_radius INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
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
