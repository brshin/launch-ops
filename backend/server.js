const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const Launch = require('./models/Launch');

const app = express();

app.use(express.json());

app.get('/launches', async (req, res) => {
    const launches = await Launch.find();

    res.json(launches);
})

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