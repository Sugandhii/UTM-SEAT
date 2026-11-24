const express = require('express');
const router = express.Router();

const seatController = require('../controllers/seatController');
const locationController = require('../controllers/locationController');

// Mounted at /api in server.js

// GET /api/cafeterias/:cafeteriaId/seats
router.get('/cafeterias/:cafeteriaId/seats', seatController.getSeatsByCafeteria);

// POST /api/cafeterias/:cafeteriaId/verify-location
router.post('/cafeterias/:cafeteriaId/verify-location', locationController.verifyLocation);

module.exports = router;
