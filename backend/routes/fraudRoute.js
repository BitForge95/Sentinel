const express = require('express');
const router = express.Router();
const {flagTransaction,getFraudLogs} = require('../controllers/fraudController');

router.post('/:id',flagTransaction);
router.get('/',getFraudLogs);

module.exports = router;