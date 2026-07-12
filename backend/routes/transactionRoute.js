const express = require('express');
const router = express.Router();
const {generateMockTransaction} = require('../controllers/transactionController');

router.post('/generate', generateMockTransaction);

module.exports = router;