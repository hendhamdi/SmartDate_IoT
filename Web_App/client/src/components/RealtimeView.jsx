import React from "react";
import dayjs from "dayjs";

export default function RealtimeView({ latest }) {

  const image = latest?.image 
    ? `data:image/jpeg;base64,${latest.image}` 
    : null;

  return (
    <div className="rounded-xl bg-slate-700/60 p-4">
      <h2 className="text-xl font-semibold text-cyan-300 mb-3">
        Détection en temps réel (MQTT direct)
      </h2>

      <div className="flex gap-4 items-start">

        {/* ✅ IMAGE */}
        <div className="w-[360px] h-[260px] bg-black rounded-lg flex justify-center items-center">
          {image ? (
            <img src={image} className="rounded-md object-contain max-h-full" />
          ) : (
            <span className="text-slate-400">Aucune image</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="text-lg">
            Catégorie de date : <span className="text-cyan-300">{latest?.label || "—"}</span>
          </div>

          <div>
            Confiance :
            <span className="text-emerald-400 font-bold ml-2">
             {latest?.confidence ?? 0}%

            </span>
          </div>

          <div className="text-slate-400">
            {latest?.timestamp
              ? dayjs(latest.timestamp * 1000).format("DD/MM/YYYY HH:mm:ss")
              : ""}
          </div>

          <div className="mt-3 p-3 bg-slate-700/40 rounded-lg">
            <div className="text-sm font-semibold text-yellow-400">Recommandation :</div>
            <div className="text-sm">
              {latest?.recommendation || "—"}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
