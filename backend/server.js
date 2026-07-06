const express = require('express')
const app = express();
const PORT  = 5000;

app.get('/',(req,res) => {
    res.send("Sentinel API is running");
});

app.listen(PORT,() => {
    console.log(`Listening to port ${PORT}`);
});