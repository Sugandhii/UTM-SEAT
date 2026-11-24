const express = require('express');
const router = express.Router();

const peakHourController =
    require('../controllers/peakHourController');

router.get('/:id/peak-hours', peakHourController.getPeakHoursByCafeteria);

module.exports = router;