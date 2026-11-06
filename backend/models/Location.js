const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    apiId: Number,
    name: String,
    active: Boolean,
    country: Object,
    description: String,
    image: Object,
    map_image: String,
    longitude: Number,
    latitude: Number,
    timezone_name: String,
    total_launch_count: Number,
    total_landing_count: Number,
    celestial_body: Object,
});

module.exports = mongoose.model('Location', locationSchema);
