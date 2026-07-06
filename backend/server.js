require('dotenv').config()
const express = require('express')
const app = express();

app.get('/',(req,res) => {
    res.send("Sentinel API is running");
});

app.listen(process.env.PORT,() => {
    console.log(`Listening to port ${process.env.PORT}`);
});