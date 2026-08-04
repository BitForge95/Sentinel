require('dotenv').config()
const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const app = express();
var cors = require('cors');
const connectDB = require('./config/db');
const transactionRoutes = require('./routes/transactionRoute.js');
const fraudRoute = require('./routes/fraudRoute.js');
const analyticRoute = require('./routes/analyticRoute.js')
const authRoute = require('./routes/authRoutes.js');
const cookieParser = require('cookie-parser');
const Protect = require('./middleware/authMiddleware.js');
const {initWorker} = require('./services/queueService.js');
const helmet = require('helmet');
const {rateLimit} = require('express-rate-limit');

app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true                
}));
app.use(express.json());
app.use(cookieParser());

connectDB();

const globalLimiter = rateLimit({
    windowMs : 15*60*1000,
    max : 100,
    message : {error : "Too many requests from this IP address. Try again later"},
    standardHeaders : true,
    legacyHeaders : false,
});

const ingestionLimiter = rateLimit({
    windowMs : 1*60*1000,
    max : 20,
    message : {error : "Ingestion rate limit exceeded." },
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// 6. Listen for connections
io.on('connection', (socket) => {
    console.log('SOC Analyst connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Analyst disconnected:', socket.id);
    });
});

app.get('/',(req,res) => {
    res.send("Sentinel API is running");
});

app.use('/api',globalLimiter);

app.use('/api/transactions/generate', ingestionLimiter);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud',fraudRoute);
app.use('/api/analytics',analyticRoute);
app.use('/api/auth', authRoute);

initWorker(io);

server.listen(process.env.PORT,() => {
    console.log(`Listening to port ${process.env.PORT}`);
});


app.post('/test',(req,res) => {
    console.log(req.body);
    res.send("Data Recieved");
})