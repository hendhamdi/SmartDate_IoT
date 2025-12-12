export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = "text-sky-400"
}) {
  return (
    <div className="
      bg-slate-700/70 backdrop-blur 
      rounded-xl shadow-lg 
      p-6               /* + espace intérieur */
      min-h-[150px]     /* ✅ HAUTEUR MINIMALE */
      flex items-center justify-between
      hover:scale-[1.02] transition
    ">

      <div className="flex flex-col justify-center h-full">
        <p className="text-lg text-white">{title}</p>

         <h3 className={`text-2xl font-bold ${accent}`}>{value}</h3>
        {subtitle && <p className="text-base text-slate-500">{subtitle}</p>}
      </div>

      <span className="text-4xl">{icon}</span> 

    </div>
  );
}
