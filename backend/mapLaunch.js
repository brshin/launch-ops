/** Map Launch Library upcoming payload → documents stored in Redis/Mongo. */
function mapUpcomingLaunches(data) {
    if (!data || !Array.isArray(data.results)) {
        return [];
    }

    return data.results.map((launch) => ({
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
}

module.exports = { mapUpcomingLaunches };
