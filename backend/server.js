const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const mongoose = require('mongoose');
require('dotenv').config();

const cors = require("cors");

const Launch = require('./models/Launch');

const app = express();

app.use(express.json());
app.use(cors());

// Wrap Express in a raw HTTP server
const server = http.createServer(app);

// Attach Socket.io to the server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// When IO hears the 'connect' event, run this function.
io.on('connection', (socket) => {
    console.log(`📡 Frontend connected: ${socket.id}`);

    // When IO hears the 'disconnect' event, run this function.
    socket.on('disconnect', () => {
        console.log(`🔌 Frontend disconnected: ${socket.id}`);
    });
});

// Redis Client Initializer
const { createClient } = require('redis');

const redisClient = createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(() => console.log('Redis Client connected to Redis'));

const redisSubscriber = redisClient.duplicate();

const setupPubSub = async() => {
    await redisSubscriber.connect().then(() => console.log('Redis Subscriber connected to Redis'));

    await redisSubscriber.subscribe('launch-updates', async (message) => {
        console.log(`Pub/Sub Event Received: ${message}`);
    });
};

setupPubSub();

app.get('/launches', async (req, res) => {

    const cacheKey = 'upcoming-launches';

    try {
        // Redis
        const cachedLaunches = await redisClient.get(cacheKey);

        if (cachedLaunches) {
            console.log("Serving from Redis cache");
            return res.json(JSON.parse(cachedLaunches));
        }
        
        //Fetch from MongoDB
        const launches = await Launch.find();
        console.log("Cache miss - recieved from database instead");

        await redisClient.setEx(cacheKey, 120, JSON.stringify(launches));

        res.json(launches);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }

});

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully!');
    }
    catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

connectDB();

app.get('/', (req, res) => {
    res.send('Server is up and connected to the database');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Server is running on http://localhost:${PORT}`);
});