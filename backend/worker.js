require('dotenv').config();

// Worker fetches launch + location catalogs on separate cadences.

const cron = require('node-cron');
const mongoose = require('mongoose');

const Launch = require('./models/Launch');
const Location = require('./models/Location');
const { mapUpcomingLaunches } = require('./mapLaunch');
const { mapLocations } = require('./mapLocation');
const { diffLaunchBoard } = require('./diffLaunchBoard');

const LAUNCHES_CACHE_KEY = 'upcoming-launches';
const LAUNCH_UPDATES_KEY = 'launch-board-updates';
/** Cap durable console updates kept in Redis (newest first). */
const LAUNCH_UPDATES_MAX = 50;

// Redis Client Initializer
const { createClient } = require('redis');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(() => console.log('Connected to Redis'));

const LOCATIONS_URL = 'https://ll.thespacedevs.com/2.3.0/locations/?format=json&limit=100';

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
        // Default LL2 page size is 10; cap stays well under max 100 for detailed payloads.
        const response = await fetch(
            'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?mode=detailed&limit=20',
        );

        if (!response.ok) {
            console.error(`API Error: HTTP ${response.status}`);
            return;
        }

        const data = await response.json();

        if (!data.results) {
            console.error("API returned 200 OK, but missing 'results' array.");
            return;
        }

        saveLaunchData(data);
    } catch (error) {
        console.error("Failed to fetch from API: ", error);
    }
};

/** Follow paginated LL2 location pages until next is null (catalog is ~70 rows). */
const fetchAllLocationPages = async () => {
    const results = [];
    let url = LOCATIONS_URL;

    while (url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Locations API Error: HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data.results)) {
            throw new Error("Locations API missing 'results' array.");
        }
        results.push(...data.results);
        url = data.next || null;
    }

    return { results };
};

const fetchLocations = async () => {
    try {
        const data = await fetchAllLocationPages();
        await saveLocationData(data);
    } catch (error) {
        console.error("Failed to fetch locations from API: ", error);
    }
};

const saveLaunchData = async (data) => {
    const launches = mapUpcomingLaunches(data);
    const atMs = Date.now();
    let events = [];

    try {
        // Prev is still in Redis — Express is too late after overwrite.
        let previous = [];
        try {
            const cached = await redisClient.get(LAUNCHES_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) previous = parsed;
            }
        } catch (err) {
            console.error("Failed to read previous launches for diff:", err);
        }

        // Empty prev = cold seed — do not spam "added" for the whole board.
        if (previous.length > 0) {
            events = diffLaunchBoard(previous, launches, atMs);
        }

        if (events.length > 0) {
            const pipeline = redisClient.multi();
            for (const event of events) {
                pipeline.lPush(LAUNCH_UPDATES_KEY, JSON.stringify(event));
            }
            pipeline.lTrim(LAUNCH_UPDATES_KEY, 0, LAUNCH_UPDATES_MAX - 1);
            await pipeline.exec();
            console.log(`Recorded ${events.length} launch-board update(s)`);
        }

        // 24 hr cache
        await redisClient.setEx(LAUNCHES_CACHE_KEY, 86400, JSON.stringify(launches));
        console.log("Saved upcoming-launches to Redis");

        try {
            await redisClient.publish(
                'launch-updates',
                JSON.stringify({ events }),
            );
            console.log("Published cache update notification via Redis Pub/Sub");
        } catch (err) {
            console.error("Failed to publish to Redis:", err);
        }
    }
    catch (error) {
        console.error(error);
    }

    for (const launch of launches) {
        const filter = { apiId: launch.apiId };
        await Launch.updateOne(filter, { $set: launch }, { upsert: true });
    }
};

const saveLocationData = async (data) => {
    const locations = mapLocations(data);

    try {
        const cacheKey = 'launch-locations';

        // 24 hr cache — worker refreshes about every 12 hours
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(locations));
        console.log(`Saved launch-locations to Redis (${locations.length} sites)`);

        try {
            await redisClient.publish('location-updates', 'CACHE_UPDATED');
            console.log("Published location cache update via Redis Pub/Sub");
        } catch (err) {
            console.error("Failed to publish locations to Redis:", err);
        }
    }
    catch (error) {
        console.error(error);
    }

    for (const location of locations) {
        const filter = { apiId: location.apiId };
        await Location.updateOne(filter, { $set: location }, { upsert: true });
    }
};

cron.schedule('*/5 * * * *', async () => {
    console.log('Cron worker triggered (launches)!');
    fetchUpcomingLaunches();
});

// Every 12 hours at :00
cron.schedule('0 */12 * * *', async () => {
    console.log('Cron worker triggered (locations)!');
    fetchLocations();
});

console.log('Cron worker started...');

fetchUpcomingLaunches();
fetchLocations();
