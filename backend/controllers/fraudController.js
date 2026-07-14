const Transaction = require('../models/Transaction');
const FraudLog = require('../models/FraudLog');

const flagTransaction = async (req,res) => {
    try {
        const transactionId = req.params.id;

        await Transaction.findByIdAndUpdate(transactionId,{status : 'flagged'});

        const newFraudLog = new FraudLog({
            transactionId : transactionId,
            reason : req.body.reason,
            severity : req.body.severity,
        });

        await newFraudLog.save();

        res.status(201).json(newFraudLog);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}

const getFraudLogs = async (req,res) => {
    try {
        const logs = await FraudLog.find()
        .populate('transactionId')
        .sort({createdAt : -1});

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}

module.exports = {flagTransaction,getFraudLogs};