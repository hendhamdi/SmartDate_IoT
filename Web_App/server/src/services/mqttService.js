// src/services/mqttService.js
import mqtt from "mqtt";
import dotenv from "dotenv";
import Detection from "../models/Detection.js";

dotenv.config();

let MQTT_CONNECTED = false;
const LATEST_CACHE = { value: null };


// =============================
//  RECOMMANDATION AUTO
// =============================
function buildRecommendation(label, confidence) {

  if (!label || label === "none") return "Aucune date détectée";

  const key = label.trim().toLowerCase();

  const map = {

    "alig": "Date sèche traditionnelle, idéale pour stockage prolongé",

    "bessra": "Très sèche, parfaite pour industries alimentaires",

    "deglet nour dryer": "Date sèche, à réhydrater avant consommation",

    "deglet nour oily": "Très tendre et riche, excellente pour consommation directe",

    "deglet nour oily treated": "Déjà traitée, prête pour emballage",

    "deglet nour semi-dryer": "Texture intermédiaire, recommandée pour vente",

    "deglet nour semi-dryer treated": "Stabilité améliorée, bonne conservation",

    "deglet nour semi-oily": "Qualité premium, idéale pour export",

    "deglet nour semi-oily treated": "Optimale après traitement, prêt à l’usage",

    "kenta": "Date artisanale, recommandée comme produit local",

    "kintichi": "Variété rare, destinée au marché spécialisé"
  };

  const base = map[key] || "Catégorie inconnue";

  if (confidence >= 90) return `✅ ${base}`;
  if (confidence >= 75) return `⚠️ ${base} — Vérifier qualité`;
  return `❌ ${base} — Risque de non conformité`;
}




// =============================
// MQTT CLIENT
// =============================
const client = mqtt.connect({
  host: process.env.MQTT_HOST,
  port: Number(process.env.MQTT_PORT || 8883),
  protocol: "mqtts",
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 3000
});


// =============================
// MQTT EVENTS
// =============================
client.on("connect", () => {
  MQTT_CONNECTED = true;
  console.log("✅ MQTT CONNECTED");
  client.subscribe(process.env.MQTT_TOPIC || "smartdate/detections");
});

client.on("close", () => {
  MQTT_CONNECTED = false;
  console.log("❌ MQTT CLOSED");
});

client.on("offline", () => {
  MQTT_CONNECTED = false;
  console.log("⚠️ MQTT OFFLINE");
});

client.on("reconnect", () => {
  console.log("🔄 MQTT RECONNECTING...");
});

client.on("error", err => {
  console.log("❌ MQTT ERROR:", err.message);
});


// =============================
// HANDLE MESSAGE
// =============================
client.on("message", async (topic, payload) => {
  try {

    const data = JSON.parse(payload.toString());

    //  Normalisation confiance en %
    const confidence = Math.round((data.confidence || 0) * 100);

    const rec = {
      label: data.label || "none",
      confidence,
      timestamp: data.timestamp ? Number(data.timestamp) : Date.now() / 1000,
      image: data.image || null,
      recommendation: buildRecommendation(data.label, confidence),
      raw: data
    };

    // CACHE DERNIÈRE DÉTECTION
    LATEST_CACHE.value = rec;

    // SAVE TO MONGO
    if (process.env.MONGO_URI) {
      await Detection.create(rec);
    }

    console.log(`📥 MQTT RECEIVED → ${rec.label} (${rec.confidence}%)`);

  } catch (e) {
    console.warn("❌ Invalid MQTT message", e.message);
  }
});


// =============================
// API EXPORTS
// =============================
export function getLatest() {
  return LATEST_CACHE.value;
}

export function isMqttConnected() {
  return MQTT_CONNECTED;
}

export default client;
