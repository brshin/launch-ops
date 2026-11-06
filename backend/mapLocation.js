/** Map Launch Library locations payload → documents stored in Redis/Mongo. */
function mapLocations(data) {
    if (!data || !Array.isArray(data.results)) {
        return [];
    }

    return data.results.map((location) => ({
        apiId: location.id,
        name: location.name,
        active: Boolean(location.active),
        country: location.country ?? null,
        description: location.description ?? null,
        image: location.image ?? null,
        map_image: location.map_image ?? null,
        longitude: location.longitude ?? null,
        latitude: location.latitude ?? null,
        timezone_name: location.timezone_name ?? null,
        total_launch_count: location.total_launch_count ?? 0,
        total_landing_count: location.total_landing_count ?? 0,
        celestial_body: location.celestial_body
            ? {
                id: location.celestial_body.id,
                name: location.celestial_body.name,
            }
            : null,
    }));
}

module.exports = { mapLocations };
