import Dashboard from "./pages/Dashboard";
import { MQTTProvider } from "./components/MQTTContext";

export default function App() {
  return (
    <MQTTProvider>
      <Dashboard />
    </MQTTProvider>
  );
}
