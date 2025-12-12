import { createContext, useContext, useEffect, useState } from "react";

const MQTTContext = createContext();

export function MQTTProvider({ children }) {
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/latest")
      .then(r => r.json())
      .then(data => {
        if (!data.error) setLatest(data);
      });

    const iv = setInterval(async () => {
      try {
        const r = await fetch("http://localhost:5000/api/latest");
        const data = await r.json();
        if (!data.error) {
          setLatest(data);
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    }, 1500);

    return () => clearInterval(iv);
  }, []);

  return (
    <MQTTContext.Provider value={{ latest, connected }}>
      {children}
    </MQTTContext.Provider>
  );
}

export function useMQTT() {
  return useContext(MQTTContext);
}
