import KpiCard from "./KpiCard";


export default function KpiOverview({ kpis, latest, temperature, avgTodayConfidence }) {
 


  if (!kpis) return null; // sécurité

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">

      <KpiCard
        title="Aujourd’hui"
        value={kpis.today}
        subtitle="détections"
        icon="📅"
      />

     <KpiCard
  title="Confiance moyenne"
  value={`${avgTodayConfidence}%`}
  subtitle="Aujourd’hui"
  icon="🎯"
  accent="text-emerald-400"
/>


      <KpiCard
        title="Température"
        value={temperature ? `${temperature}°C` : "Localisation…"}

        subtitle={latest?.humidity ? `${latest.humidity}% humidité` : ""}
        icon="🌡️"
        accent="text-violet-400"
      />

      <KpiCard
        title="Total"
        value={kpis.total}
        subtitle="prédictions"
        icon="📊"
        accent="text-pink-400"
      />

    </section>
  );
}
