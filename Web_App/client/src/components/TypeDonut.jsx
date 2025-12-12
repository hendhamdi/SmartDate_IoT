import { useMemo } from "react";

export default function TypeDonut({ stats }) {

  const types = useMemo(() => {
    if (!stats?.byType) return [];
    return stats.byType.filter(t => t._id !== "none"); 
  }, [stats]);

  const total = types.reduce((a, t) => a + t.count, 0);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  let acc = 0;

  const slices = types.map((t, i) => {
    const value = t.count / total;

    const segment = {
      label: t._id,
      count: t.count,
      percent: (value * 100).toFixed(1),
      dash: value * circumference,
      offset: -acc * circumference,
      color: `hsl(${i * 35}, 70%, 55%)`
    };

    acc += value;
    return segment;
  });

  return (
    <div className="bg-slate-500/70 p-6 rounded-xl shadow-lg h-full flex flex-col">

      <h3 className="font-semibold text-white mb-4">🍩 Répartition des types</h3>

      <div className="flex-1 flex items-center justify-center">
        <svg width="200" height="200">
          <g transform="rotate(-90 100 100)">
            {slices.map((s, i) => (
              <circle
                key={i}
                r={radius}
                cx="100"
                cy="100"
                fill="none"
                stroke={s.color}
                strokeWidth="26"
                strokeDasharray={`${s.dash} ${circumference}`}
                strokeDashoffset={s.offset}
                strokeLinecap="round"
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        {slices.map((s, i) => (
          <div key={i} className="flex justify-between">
            <span>{s.label}</span>
            <span className="text-slate-300">{s.percent}%</span>
          </div>
        ))}
      </div>

    </div>
  );
}
