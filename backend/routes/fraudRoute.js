const express = require('express');
const router = express.Router();
const {flagTransaction,getFraudLogs,resolveIncident} = require('../controllers/fraudController');

router.post('/:id',flagTransaction);
router.get('/',getFraudLogs);
router.delete('/:id/resolve', resolveIncident);

module.exports = router;