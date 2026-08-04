const Transaction = require('../models/Transaction');
const {analyzeTransaction} = require('../services/aiService');
const FraudLog = require('../models/FraudLog');
const {Queue,Worker} = require('bullmq');

const connection = {
    host : process.env.REDIS_HOST ||  "redis",
    port : process.env.REDIS_PORT || 6380,
};

const transactionQueue = new Queue("transaction-ingestion", {
    connection,
});

const initWorker = (io) => {
    const worker = new Worker("transaction-ingestion",async(job) => {
        console.log("WOrker caught a Job : ",job.data);

        const db_data = job.data;

        const aiVerdict = await analyzeTransaction(db_data);

        const dummy = new Transaction({
            senderAccount : db_data.senderAccount,
            receiverAccount : db_data.receiverAccount,
            amount : db_data.amount,
            currency : db_data.currency,
            status: aiVerdict.isFraud ? 'flagged' : 'pending',
        });
        //Insetad of just sending the new Transaction(req.body) I have whitelisted the necessary entries

        await dummy.save();

        // If AI found fraud , logging the fraud transaction the FraudLog just for future ref
        if(aiVerdict.isFraud) {
            await FraudLog.create({
                transactionId : dummy._id,
                reason : aiVerdict.reason,
                severity : 'High',
            })
        }

        io.emit('dashboard_update');
    }, {
        connection,
    });

    worker.on('completed', job => console.log(`Job ${job.id} completed.`));
    worker.on('failed', (job, err) => console.log(`Job ${job.id} failed:`, err));
}

module.exports = {transactionQueue,connection,initWorker};