const express = require('express');
const router = express.Router();
const {flagTransaction,getFraudLogs,resolveIncident} = require('../controllers/fraudController');
const {Protect} = require('../middleware/authMiddleware');

router.post('/:id',Protect,flagTransaction);
router.get('/',Protect,getFraudLogs);
router.delete('/:id/resolve',Protect ,resolveIncident);

module.exports = router;