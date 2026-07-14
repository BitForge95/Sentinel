require('dotenv').config()
const express = require('express');
const app = express();
var cors = require('cors');
const connectDB = require('./config/db');
const transactionRoutes = require('./routes/transactionRoute.js');
const fraudRoute = require('./routes/fraudRoute.js');
const analyticRoute = require('./routes/analyticRoute.js')

app.use(cors());
app.use(express.json());


connectDB();

app.get('/',(req,res) => {
    res.send("Sentinel API is running");
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud',fraudRoute);
app.use('/api/analytics',analyticRoute);

app.listen(process.env.PORT,() => {
    console.log(`Listening to port ${process.env.PORT}`);
});


app.post('/test',(req,res) => {
    console.log(req.body);
    res.send("Data Recieved");
})