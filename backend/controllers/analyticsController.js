const Transaction = require('../models/Transaction.js');

const getDashboardStats = async(req,res) => {
    try {
        const totalTransactions = await Transaction.countDocuments();
        const flaggedTransactions = await Transaction.countDocuments({status : 'flagged'});

        let volumeResult = await Transaction.aggregate([
            {$group : { _id : null ,totalVolume : {$sum : "$amount"}}}
        ]);

        let totalVolume = 0;
        if(volumeResult.length > 0) {
            totalVolume = volumeResult[0].totalVolume;
        } else {
            totalVolume = 0;
        }

        res.status(200).json({totalTransactions,flaggedTransactions,totalVolume});

    } catch (error) {
        res.status(500).json({error : error.message });
    }
}

module.exports = {getDashboardStats};

