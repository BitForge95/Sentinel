const express = require('express');
const router = express.Router();
const {getDashboardStats} = require('../controllers/analyticsController');
const {Protect} = require('../middleware/authMiddleware');

router.get('/',Protect,getDashboardStats);

module.exports = router;