const mongoose = require('mongoose');

async function connectDB() {
    await mongoose.connect(process.env.MONGOD_URI);
    console.log("DB COnnected Sucessfully");
}

module.exports = connectDB;