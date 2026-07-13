const Transaction = require('../models/Transaction');

const generateMockTransaction = async (req,res) => {
    try {
        const dummy = new Transaction({
            senderAccount : '111',
            receiverAccount : '222',
            amount : 123,
            currency : 'INR'
        })

        await dummy.save();

        res.status(201).json(dummy);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}

module.exports = {generateMockTransaction};