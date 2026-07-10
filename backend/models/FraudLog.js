const mongoose = require('mongoose');
const { Schema } = mongoose;

const fraudLogSchema = new Schema({
    transactionId : {type : mongoose.Types.ObjectId , ref : 'Transaction', required : true},
    reason : {type : String , required : true},
    severity : {type : String , enum:['low','medium','high','critical'],default:'medium'},
    detectedAt : {type : Date , default : Date.now},
},{timestamps : true});

module.exports = mongoose.model('FraudLog',fraudLogSchema);