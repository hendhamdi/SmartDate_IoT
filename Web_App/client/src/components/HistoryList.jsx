import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";

const DATE_TYPES = [
  "alig",
  "bessra",
  "Deglet Nour dryer",
  "Deglet Nour oily",
  "Deglet Nour oily treated",
  "Deglet Nour semi-dryer",
  "Deglet Nour semi-dryer treated",
  "Deglet Nour semi-oily",
  "Deglet Nour semi-oily treated",
  "kenta",
  "kintichi"
];

export default function HistoryList({ history }) {

  const PER_PAGE = 5;
  const [page, setPage] = useState(1);

  //  filtres
  const [search, setSearch] = useState("");
  const [day, setDay] = useState("");

  //  nettoyage manuel
  const [cleared, setCleared] = useState(false);

  //  filtrage avancé
  const filtered = useMemo(() => {
    return history.filter(h => {

      if (cleared) return false;
      if (!h.label || h.label === "none") return false;

      //  filtre par type
      if (search && h.label !== search) return false;

      //  filtre par journée
      if (day && !dayjs.unix(h.timestamp).isSame(day, 'day')) return false;

      return true;
    });
  }, [history, search, day, cleared]);

  //  pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  //  reset page si filtre change
  useEffect(() => {
    setPage(1);
  }, [filtered.length]);

  //  RESET TOTAL
  function clearAll() {
    setCleared(true);
    setSearch("");
    setDay("");
    setPage(1);
  }

  return (
    <div className="bg-slate-700/70 backdrop-blur rounded-xl shadow-lg p-6">

      <h2 className="text-lg font-semibold mb-4 text-white">
        📜 Historique des détections
      </h2>

      <div className="flex flex-wrap gap-3 mb-4">

        <select
          value={search}
          onChange={e => { setSearch(e.target.value); setCleared(false); }}
          className="bg-slate-800 rounded px-3 py-1 text-sm text-white outline-none"
        >
          <option value="">🌴 Tous les types</option>
          {DATE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="date"
          value={day}
          onChange={e => { setDay(e.target.value); setCleared(false); }}
          className="bg-slate-800 rounded px-3 py-1 text-sm text-white"
        />

        <button
          onClick={clearAll}
          className="bg-red-500/80 hover:bg-red-600 px-3 py-1 rounded text-xs font-semibold"
        >
          🧹 Vider
        </button>

      </div>

      {pageItems.length === 0 && (
        <p className="text-slate-400 text-sm">
          Aucune donnée correspondant aux filtres.
        </p>
      )}

      <div className="space-y-3">
        {pageItems.map((row, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-slate-800/60 rounded-lg px-4 py-3 hover:bg-slate-700 transition"
          >

            <div className="text-sm text-slate-300 w-1/3">
              {dayjs.unix(row.timestamp).format("DD/MM HH:mm")}
            </div>

            <div className="font-medium w-1/3 text-center">
              {row.label}
            </div>

            <div className={`font-bold w-1/3 text-right
              ${row.confidence >= 90 ? "text-emerald-400"
                : row.confidence >= 75 ? "text-yellow-400"
                : "text-red-400"}
            `}>
              {row.confidence}%
            </div>

          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">

        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30">
          ◀ Précédent
        </button>

        <span className="text-slate-300 text-sm">
          Page {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-1 rounded bg-slate-800 hover:bg-slate-600 disabled:opacity-30">
          Suivant ▶
        </button>

      </div>

    </div>
  );
}
