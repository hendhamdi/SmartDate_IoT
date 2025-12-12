export default function Footer() {
  return (
    <footer className="mt-12 text-center text-sm text-slate-400 border-t border-slate-700 pt-4">
      <p>SmartDate IoT — Surveillance intelligente des dattes</p>
      <p>MQTT temps réel • Dashboard React • {new Date().getFullYear()}</p>
    </footer>
  );
}
