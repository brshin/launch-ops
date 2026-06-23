const mongoose = require('mongoose');

const launchSchema = new mongoose.Schema({
    name: String
});

module.exports = mongoose.model('Launch', launchSchema);

/* Other data
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
*/