# IOT/mqtt_logger.py — Logger MQTT pour SmartDate (version sécurisée avec .env)
import os, csv, json, ssl, time
from datetime import datetime
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# -----------------------------
# Charger les variables d'environnement
# -----------------------------
load_dotenv()

BROKER_HOST = os.getenv("BROKER_HOST")
BROKER_PORT = int(os.getenv("BROKER_PORT", 8883))
BROKER_USER = os.getenv("BROKER_USER")
BROKER_PASS = os.getenv("BROKER_PASS")
TOPIC = os.getenv("TOPIC")
OUT_CSV = os.path.join(os.path.dirname(__file__), "detections_log.csv")

USE_MONGO = os.getenv("USE_MONGO", "False") == "True"
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")
MONGO_COLL = os.getenv("MONGO_COLL")

# -----------------------------
# Connexion MongoDB si activé
# -----------------------------
if USE_MONGO:
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        mongo_db = mongo_client[MONGO_DB]
        mongo_coll = mongo_db[MONGO_COLL]
        mongo_client.admin.command('ping')
        print("✅ MongoDB accessible.")
    except Exception as e:
        print("⚠️ MongoDB non disponible:", e)
        USE_MONGO = False

# -----------------------------
# Anti-spam pour label 'none'
# -----------------------------
last_none_logged = 0
NONE_LOG_INTERVAL = 5.0  # secondes

# -----------------------------
# Callbacks MQTT
# -----------------------------
def on_connect(client, userdata, flags, rc):
    print("✅ Connecté au broker (rc=%s)" % rc)
    client.subscribe(TOPIC)
    print("📡 Subscribed to", TOPIC)

def on_message(client, userdata, msg):
    global last_none_logged
    try:
        payload = msg.payload.decode()
        data = json.loads(payload)
        label = data.get("label")
        confidence = data.get("confidence", 0.0)
        timestamp = data.get("timestamp", datetime.utcnow().isoformat())

        # ignorer 'none' trop fréquent
        if label == "none":
            now = time.time()
            if now - last_none_logged < NONE_LOG_INTERVAL:
                return
            last_none_logged = now

        # Écriture CSV
        first = not os.path.exists(OUT_CSV)
        with open(OUT_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if first:
                writer.writerow(["timestamp", "label", "confidence"])
            writer.writerow([timestamp, label, confidence])

        # Insertion MongoDB
        if USE_MONGO:
            try:
                rec = {"timestamp": timestamp, "label": label, "confidence": float(confidence)}
                mongo_coll.insert_one(rec)
            except Exception as me:
                print("⚠️ Mongo insert failed:", me)

        print(f"📥 {timestamp} → {label} ({confidence})")

    except Exception as e:
        print("⚠️ Erreur message:", e)

# -----------------------------
# Fonction principale
# -----------------------------
def main():
    client = mqtt.Client(client_id="smartdate_sub", clean_session=True)
    client.username_pw_set(BROKER_USER, BROKER_PASS)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.tls_insecure_set(False)
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER_HOST, BROKER_PORT, 60)
    print(f"📡 Tentative connexion à {BROKER_HOST}:{BROKER_PORT} ...")
    client.loop_forever()

# -----------------------------
# Exécution script
# -----------------------------
if __name__ == "__main__":
    main()
