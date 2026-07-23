const express = require('express');
const router = express.Router();
const {generateMockTransaction, getAllTransactions} = require('../controllers/transactionController');
const {Protect} = require('../middleware/authMiddleware');

router.post('/generate',Protect ,generateMockTransaction);
router.get('/',Protect,getAllTransactions);

module.exports = router;