export default function ActivityBars({ data }) {

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-slate-500/70 rounded-xl p-6 shadow-lg h-full flex flex-col">

      <h3 className="font-semibold text-white mb-4">
        📊 Activité (7 jours)
      </h3>

      <div className="flex items-end gap-3 flex-1">

        {data.map((d, i) => (
          <div key={i} className="flex flex-col justify-end items-center flex-1 h-full">

            <div
              className="w-6 bg-cyan-400 rounded-t hover:bg-cyan-300 transition-all"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.count} détections`}
            />

            <span className="text-xs text-slate-400 mt-1">
              {d.day}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}
