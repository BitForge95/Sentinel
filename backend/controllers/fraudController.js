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

        req.io.emit('dashboard_update');

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

const resolveIncident = async (req, res) => {
    try {
        const logId = req.params.id;
        
        // fetch the log to get the associated transaction ID
        const log = await FraudLog.findById(logId);
        if (!log) {
            return res.status(404).json({ error: 'incident not found' });
        }

        // update the transaction status so it is no longer pending or flagged
        await Transaction.findByIdAndUpdate(log.transactionId, { status: 'resolved' });

        // remove the log from the active threats table
        await FraudLog.findByIdAndDelete(logId);

        req.io.emit('dashboard_update');

        res.status(200).json({ message: 'incident resolved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { flagTransaction, getFraudLogs, resolveIncident };