// Worker fetches API data every minute

const cron = require('node-cron');
const mongoose = require('mongoose');
require('dotenv').config();

const Launch = require('./models/Launch');

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
    const response = await fetch('https://ll.thespacedevs.com/2.3.0/launches/upcoming/');
    const data = await response.json();

    saveData(data);
};

const saveData = async (data) => {
    const launches = data.results;

    for (const launch of launches) {
        const filter = { apiId: launch.id };

        const update = {
            $set: {
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
            }
        };

        await Launch.updateOne(filter, update, { upsert: true });
        console.log("Data updated successfully.");
    }
};


cron.schedule('* * * * *', async () => {
    console.log('Cron worker triggered!');
    fetchUpcomingLaunches();
});

console.log('Cron worker started...');