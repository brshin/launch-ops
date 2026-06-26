import { useState, useEffect } from 'react';

export default function App() {
  const [launches, setLaunches] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/launches')
      .then((res) => res.json())
      .then((data) => {
        console.log("API DATA:", data);
        setLaunches(data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold ">
        Upcoming Launches
      </h1>
      <div>
        {launches.map((launch, index) => (
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
        ))}
      </div>
    </div>

  );
}