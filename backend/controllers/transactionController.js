const Transaction = require('../models/Transaction');

const generateMockTransaction = async (req,res) => {
    try {
        const db_data = req.body;
        const dummy = new Transaction({
            senderAccount : db_data.senderAccount,
            receiverAccount : db_data.receiverAccount,
            amount : db_data.amount,
            currency : db_data.currency,
        });
        //Insetad of just sending the new Transaction(req.body) I have whitelisted the necessary entries

        await dummy.save();

        res.status(201).json(dummy);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}

const getAllTransactions = async (req,res) => {
    try {
        const transactions = await Transaction.find().sort({createdAt : -1});

        res.status(201).json(transactions);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}

module.exports = {generateMockTransaction,getAllTransactions};