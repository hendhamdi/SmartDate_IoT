import { useEffect, useState } from "react";

export default function Header() {

  const [health, setHealth] = useState({
    backend: false,
    mqtt: false,
    loading: true
  });

  const checkHealth = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/health");
      const data = await res.json();
      setHealth({
        backend: Boolean(data.backend),
        mqtt: Boolean(data.mqtt),
        loading: false
      });
    } catch (err) {
      setHealth({
        backend: false,
        mqtt: false,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusOK = health.backend && health.mqtt;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-8 bg-slate-800 shadow-md">


      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-2xl shadow">
          📊
        </div>
        <div>
          <h1 className="text-2xl font-bold text-cyan-300">SmartDate IoT</h1>
          <p className="text-sm text-slate-400">Dashboard Temps Réel</p>
        </div>
      </div>

      <div className="text-right">
        {health.loading ? (
          <span className="text-yellow-300">⏳ Connexion...</span>
        ) : (
          <>
            <p>
              BACKEND :
              <span className={health.backend ? "text-green-400" : "text-red-500"}>
                {health.backend ? " 🟢 ONLINE" : " 🔴 OFFLINE"}
              </span>
            </p>
            <p>
              MQTT :
              <span className={health.mqtt ? "text-green-400" : "text-red-500"}>
                {health.mqtt ? " 🟢 CONNECTED" : " 🔴 DISCONNECTED"}
              </span>
            </p>

            {!statusOK && (
              <p className="text-xs text-orange-400 mt-1">
                ⚠️ SYSTEM ISSUE
              </p>
            )}
          </>
        )}
      </div>

    </header>
  );
}
