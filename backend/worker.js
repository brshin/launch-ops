require('dotenv').config();

// Worker fetches API data every 5 minutes

const cron = require('node-cron');
const mongoose = require('mongoose');

const Launch = require('./models/Launch');

// Redis Client Initializer
const { createClient } = require('redis');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(() => console.log('Connected to Redis'));

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

const fetchUpcomingLaunches = async() => {
    try {
        const response = await fetch('https://ll.thespacedevs.com/2.3.0/launches/upcoming/');

        if (!response.ok) {
            console.error(`API Error: HTTP ${response.status}`);
            return;
        }

        const data = await response.json();

        if (!data.results) {
            console.error("API returned 200 OK, but missing 'results' array.");
            return;
        }

        saveData(data);
    } catch (error) {
        console.error("Failed to fetch from API: ", error);
    }
    
};

const saveData = async (data) => {
    const launches = data.results.map((launch) => ({
        apiId: launch.id,
        name: launch.name,
        status: launch.status,
        last_updated: launch.last_updated,
        net: launch.net,
        net_precision: launch.net_precision,
        window_start: launch.window_start,
        window_end: launch.window_end,
        image: launch.image,
        launch_service_provider: launch.launch_service_provider,
        rocket: launch.rocket,
        mission: launch.mission,
        pad: launch.pad
    }));
    
    // Save to Redis
    try {
        const cacheKey = 'upcoming-launches';

        // 24 hr cache
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(launches));
        console.log("Saved upcoming-launches to Redis");

        // Redis Pub
        try {
            await redisClient.publish('launch-updates', 'CACHE_UPDATED');
            console.log("Published cache update notification via Redis Pub/Sub");
        } catch (err) {
            console.error("Failed to publish to Redis:", err);
        }
    }
    catch (error) {
        console.error(error);
    }



    // MongoDB

    for (const launch of launches) {
        const filter = { apiId: launch.apiId };

        await Launch.updateOne(filter, { $set: launch }, { upsert: true });
        // console.log("Data updated successfully.");
    }
};


cron.schedule('*/5 * * * *', async () => {
    console.log('Cron worker triggered!');
    fetchUpcomingLaunches();
});

console.log('Cron worker started...');

fetchUpcomingLaunches();