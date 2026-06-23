const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const Launch = require('./models/Launch');

const app = express();

app.use(express.json());

const fetchUpcomingLaunches = async() => {
    const response = await fetch('https://ll.thespacedevs.com/2.3.0/launches/upcoming/');
    const data = await response.json();

    // console.log(data);

    saveData(data);
};

const saveData = async (data) => {
    // Save the first entity for testing
    console.log(data.results[0]);
    const entity = data.results[0];
    console.log(entity);

    const nextLaunch = new Launch({
        name: entity.name
    });

    await nextLaunch.save();
    console.log("Entity saved successfully")
};

fetchUpcomingLaunches();

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