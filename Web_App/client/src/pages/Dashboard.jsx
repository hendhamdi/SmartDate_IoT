import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useMQTT } from "../components/MQTTContext";

import Header from '../components/Header';
import KpiOverview from "../components/KpiOverview";   
import RealtimeView from '../components/RealtimeView';
import HistoryList from '../components/HistoryList';
import Footer from '../components/Footer';
import ActivityBars from "../components/ActivityBars";
import TypeDonut from "../components/TypeDonut";


// ============================
// CHART HELPERS
// ============================
function generateEmptyWeek() {
  return Array.from({ length: 7 }).map((_, i) => ({
    day: dayjs().subtract(6 - i, 'day').format('ddd'),
    count: 0
  }));
}

function incrementChartDay(data, timestamp) {
  const label = dayjs.unix(timestamp).format('ddd');
  return data.map(d =>
    d.day === label ? { ...d, count: d.count + 1 } : d
  );
}


// ============================
// DASHBOARD COMPONENT
// ============================
export default function Dashboard() {

  const { connected, lastMessage } = useMQTT();

  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [kpis, setKpis] = useState({ today: 0, avgConfidence: 0, total: 0 });
  const [chartData, setChartData] = useState(generateEmptyWeek());
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [temperature, setTemperature] = useState(null);
  const [todayConfidences, setTodayConfidences] = useState([]);

  const avgTodayConfidence =
    todayConfidences.length === 0
      ? 0
      : Math.round(todayConfidences.reduce((a, b) => a + b, 0) / todayConfidences.length);


  // ============================
  // MQTT MESSAGE HANDLER
  // ============================
  useEffect(() => {
    if (!lastMessage) return;

    const record = {
      label: lastMessage.label ?? "Inconnu",
      confidence: lastMessage.confidence || 0,
      temp: lastMessage.temp ?? null,
      humidity: lastMessage.humidity ?? null,
      timestamp: Number(lastMessage.timestamp) || Date.now() / 1000,
      image: lastMessage.image || null,
      recommendation: lastMessage.recommendation || ""
    };

    if (record.label === "none") return;
    if (record.confidence < confidenceThreshold) return;

    handleIncoming(record);

  }, [lastMessage, confidenceThreshold]);



  // ============================
  // LOAD KPIS FROM API
  // ============================
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost:5000/api/stats");
        const data = await res.json();

        if (data.total !== undefined) {
          setKpis({
            total: data.total,
            today: data.today,
            avgConfidence: Math.round(data.avgConfidence || 0),
            byType: data.byType
          });
        }
      } catch (e) {
        console.log("API stats error", e.message);
      }
    }

    fetchStats();
    const timer = setInterval(fetchStats, 10000);
    return () => clearInterval(timer);

  }, []);



  // ============================
  // LOAD LAST DETECTION
  // ============================
  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch("http://localhost:5000/api/latest");
        const data = await res.json();
        if (!data.error) handleIncoming(data);
      } catch (e) {
        console.log("API latest error", e.message);
      }
    }

    fetchLatest();
  }, []);




  // ============================
  // WEATHER API
  // ============================
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );

      const data = await res.json();
      setTemperature(data?.current_weather?.temperature || null);
    });

  }, []);




  // ============================
  // LOAD FULL HISTORY + CHART
  // ============================
  useEffect(() => {
    async function fetchFullHistory() {
      try {
        const res = await fetch("http://localhost:5000/api/history");
        const data = await res.json();

        if (!Array.isArray(data)) return;

        // Load History List
        const filtered = data
          .filter(h => h.label !== "none")
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 200);

        setHistory(filtered);

        // Load chart for 7 days
        let chart = generateEmptyWeek();

        filtered.forEach(r => {
          chart = incrementChartDay(chart, r.timestamp);
        });

        setChartData(chart);

      } catch (e) {
        console.log("API history error", e.message);
      }
    }

    fetchFullHistory();
  }, []);




  // ============================
  // INTERNAL UI UPDATE
  // ============================
  function handleIncoming(record) {

    setLatest(record);

    // update list
    setHistory(prev => [record, ...prev].slice(0, 200));

    // update 7-days chart
    setChartData(d => incrementChartDay(d, record.timestamp));

    // update average of the day
    if (dayjs.unix(record.timestamp).isSame(dayjs(), 'day')) {
      setTodayConfidences(prev => [...prev, record.confidence]);
    }
  }



  // ============================
  // SIMULATION ONLY
  // ============================
  function simulateDetection() {
    const fake = {
      label: "Simulation",
      confidence: Math.floor(Math.random() * 40) + 60,
      temp: 24,
      humidity: 41,
      timestamp: Date.now() / 1000,
      recommendation: "Simulation locale"
    };
    handleIncoming(fake);
  }



  // ============================
  // RENDER UI
  // ============================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6">

      <Header connected={connected} />

      <div className="pt-28 w-full">
        <KpiOverview 
          kpis={kpis}
          latest={latest}
          temperature={temperature}
          avgTodayConfidence={avgTodayConfidence}
        />
      </div>

      {/* ROW 1 */}
      <div className="grid grid-cols-4 gap-6 mt-6 w-full items-stretch">

        <div className="col-span-3 h-full">
          <RealtimeView 
            latest={latest}
            onSimulate={simulateDetection}
          />
        </div>

        <div className="col-span-1 h-full">
          <ActivityBars data={chartData} />
        </div>

      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-4 gap-6 mt-6 w-full items-stretch">

        <div className="col-span-3 h-full">
          <HistoryList history={history} />
        </div>

        <div className="col-span-1 h-full">
          <TypeDonut stats={kpis} />
        </div>

      </div>

      <div className="mt-6 w-full">
        <Footer />
      </div>

    </div>
  );
}
