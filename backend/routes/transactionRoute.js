const express = require('express');
const router = express.Router();
const {generateMockTransaction, getAllTransactions} = require('../controllers/transactionController');

router.post('/generate', generateMockTransaction);
router.get('/',getAllTransactions);

module.exports = router;