import { useEffect, useState } from "react";

export default function ChartPanel() {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/stats")
      .then(r => r.json())
      .then(setData)
      .catch(console.error);

    const timer = setInterval(() => {
      fetch("http://localhost:5000/api/stats")
        .then(r => r.json())
        .then(setData);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  if (!data) return (
    <div className="bg-slate-800/60 rounded-xl p-4 text-slate-400">
      Chargement graphique...
    </div>
  );

  const weekly = data.week || [5, 8, 10, 6, 12, 18, data.today || 1];

  const max = Math.max(...weekly, 1);
  const width = 280;
  const height = 120;
  const step = width / (weekly.length - 1);

  const points = weekly.map((val, i) => {
    const x = i * step;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-slate-900/70 backdrop-blur rounded-xl shadow-lg p-6">

      <h3 className="font-semibold text-lg mb-4 text-white">
        📈 Évolution des détections
      </h3>

      <svg width={width} height={height} className="w-full">

        <polyline
          fill="none"
          stroke="#22d3ee"
          strokeWidth="3"
          points={points}
        />

        {weekly.map((val, i) => {
          const x = i * step;
          const y = height - (val / max) * height;
          return (
            <circle key={i} cx={x} cy={y} r="4" fill="#22d3ee" />
          );
        })}

      </svg>

      <div className="flex justify-between text-xs text-slate-400 mt-3">
        <span>-6j</span>
        <span>-4j</span>
        <span>-2j</span>
        <span>Aujourd’hui</span>
      </div>

    </div>
  );
}
