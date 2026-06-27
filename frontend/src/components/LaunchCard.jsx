import { useState } from 'react';

export default function LaunchCard({ launch }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div>
            {/* Overview Section */}
            <div>
                <h2 className="text-xl font-semibold">{launch.name}</h2>
                <p className="text-gray-400">Scheduled Launch Time: {new Date(launch.net).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                </p>
                <button onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Close' : 'More'}
                </button>
            </div>
            {/* Expanded Section */}
            {isExpanded && (
                <div>
                    <h2>Now Expanded.</h2>
                </div>
            )}
        </div>
    );
}


/*
        <div>
            <h2 className="text-xl font-semibold">{launch.name}</h2>
            <p className="text-gray-400">Scheduled Launch Time: {new Date(launch.net).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
          </div>
*/