const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    senderAccount : {type : String , required : true},
    receiverAccount : {type : String , required : true},
    amount : {type : Number , required : true},
    currency : {type : String , required : true, default : 'INR'},
    status : {type : String, enum:['pending','cleared','flagged'], default : 'pending'},
},{timestamps : true});

module.exports = mongoose.model('Transaction',transactionSchema);