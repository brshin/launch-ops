const mongoose = require('mongoose');

const launchSchema = new mongoose.Schema({
    apiId: String,
    name: String,
    status: Object,
    last_updated: String,
    net: String,
    net_precision: Object,
    window_start: String,
    window_end: String,
    image: Object,
    launch_service_provider: Object,
    rocket: Object,
    mission: Object,
    pad: Object
});

module.exports = mongoose.model('Launch', launchSchema);