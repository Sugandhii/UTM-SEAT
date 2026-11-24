const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');

// Mounted at /api/bookings in server.js
router.get('/active', bookingController.getActiveBooking);
router.post('/hold', bookingController.holdSeat);
router.post('/:bookingId/confirm', bookingController.confirmBooking);
router.post('/:bookingId/cancel', bookingController.cancelBooking);

module.exports = router;
