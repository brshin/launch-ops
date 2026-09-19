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
        pad: launch.pad,
        webcast_live: Boolean(launch.webcast_live),
        vid_urls: Array.isArray(launch.vid_urls) ? launch.vid_urls : [],
    }));
}

module.exports = { mapUpcomingLaunches };
