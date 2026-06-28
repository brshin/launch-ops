import { useState } from 'react';

export default function LaunchCard({ launch }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div>
            {/* Overview Section */}
            <div>
                <h2 className="text-xl font-semibold">{launch.name}</h2>
                <p>{launch.launch_service_provider.name}</p>
                <p className="text-gray-400">Scheduled Launch Time: {new Date(launch.net).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                </p>
                <img src={launch.image.image_url}></img>
                <button onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Close' : 'More'}
                </button>
            </div>
            {/* Expanded Section */}
            {isExpanded && (
                <div>
                    <h3>Pad: {launch.pad.name}</h3>
                    <p>Last Updated: {launch.last_updated}</p>
                    <p>Status: {launch.status.abbrev}</p>
                    <p>Window: {launch.window_start} - {launch.window_end}</p>

                    <h3>Mission: {launch.mission.name}</h3>
                    <p>{launch.mission.orbit.name}</p>
                    <p>{launch.mission.description}</p>

                </div>
            )}
        </div>
    );
}

/*
    apiId: launch.id,
    //name: launch.name,
    //status: launch.status,
    //last_updated: launch.last_updated,
    //net: launch.net,
    net_precision: launch.net_precision,
    //window_start: launch.window_start,
    //window_end: launch.window_end,
    //image: launch.image,
    //launch_service_provider: launch.launch_service_provider,
    //rocket: launch.rocket,
    //mission: launch.mission,
    pad: launch.pad
*/