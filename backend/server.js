require('dotenv').config()
const express = require('express');
const app = express();
var cors = require('cors');
const connectDB = require('./config/db');
const transactionRoutes = require('./routes/transactionRoute.js');

app.use(cors());
app.use(express.json());


connectDB();

app.get('/',(req,res) => {
    res.send("Sentinel API is running");
});

app.use('/api/transactions', transactionRoutes);

app.listen(process.env.PORT,() => {
    console.log(`Listening to port ${process.env.PORT}`);
});


app.post('/test',(req,res) => {
    console.log(req.body);
    res.send("Data Recieved");
})