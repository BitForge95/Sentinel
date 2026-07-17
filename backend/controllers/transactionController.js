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
        // default to page 1 and 50 items per page to prevent memory overload
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;


        const transactions = await Transaction.find().sort({createdAt : -1}).skip(skip).limit(limit);

        const total = await Transaction.countDocuments();

        res.status(200).json({
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}

module.exports = {generateMockTransaction,getAllTransactions};