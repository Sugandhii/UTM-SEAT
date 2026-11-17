const express = require('express');
const router = express.Router();

const cafeteriaController =
    require('../controllers/cafeteriaController.js');

router.get('/', cafeteriaController.getAllCafeterias);

module.exports = router;