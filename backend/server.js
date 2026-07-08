require('dotenv').config()
const express = require('express')
const app = express();
var cors = require('cors');

app.use(cors);

app.get('/',(req,res) => {
    res.send("Sentinel API is running");
});

app.listen(process.env.PORT,() => {
    console.log(`Listening to port ${process.env.PORT}`);
});

app.post('/test',(req,res) => {
    console.log(req.body);
    res.send("Data Recieved");
})