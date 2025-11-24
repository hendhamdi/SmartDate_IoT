import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import os
import time
import json
import paho.mqtt.client as mqtt
import ssl
from dotenv import load_dotenv

# -----------------------------
# Charger variables d'environnement
# -----------------------------
load_dotenv()
BROKER_HOST = os.getenv("BROKER_HOST")
BROKER_PORT = int(os.getenv("BROKER_PORT", 8883))
BROKER_USER = os.getenv("BROKER_USER")
BROKER_PASS = os.getenv("BROKER_PASS")
MQTT_TOPIC = os.getenv("TOPIC")

# -----------------------------
# Filtre forme d'une datte
# -----------------------------
def is_date_box(box, frame):
    x1, y1, x2, y2 = map(int, box)
    roi = frame[y1:y2, x1:x2]
    if roi.size == 0:
        return False
    w, h = x2 - x1, y2 - y1
    ratio = h / w
    area = w * h
    if area < 2000 or area > 20000 or ratio < 1.2 or ratio > 3.5:
        return False
    return True

# -----------------------------
# Charger YOLOv8
# -----------------------------
try:
    from ultralytics import YOLO
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics"])
    from ultralytics import YOLO

yolo = YOLO("yolov8n.pt")
print("✅ YOLOv8 chargé.")

# -----------------------------
# Charger EfficientNetB3
# -----------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/smartdate_efficientnetb3.keras")
classifier = load_model(MODEL_PATH, compile=False)
print("✅ EfficientNetB3 chargé.")

CLASS_NAMES = [
    "alig", "bessra", "Deglet Nour dryer", "Deglet Nour oily",
    "Deglet Nour oily treated", "Deglet Nour semi-dryer",
    "Deglet Nour semi-dryer treated", "Deglet Nour semi-oily",
    "Deglet Nour semi-oily treated", "kenta", "kintichi"
]

IMG_SIZE = (300, 300)
def preprocess_image(img):
    img = cv2.resize(img, IMG_SIZE)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = tf.keras.applications.efficientnet.preprocess_input(img)
    return np.expand_dims(img, axis=0)

# -----------------------------
# MQTT setup
# -----------------------------
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"📡 MQTT connecté à {BROKER_HOST}:{BROKER_PORT}")
    else:
        print(f"⚠️ MQTT échec connexion rc={rc}")

mqtt_client = mqtt.Client(client_id="smartdate_pub", protocol=mqtt.MQTTv311)
if BROKER_USER and BROKER_PASS:
    mqtt_client.username_pw_set(BROKER_USER, BROKER_PASS)
mqtt_client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
mqtt_client.tls_insecure_set(False)
mqtt_client.on_connect = on_connect
mqtt_client.connect(BROKER_HOST, BROKER_PORT, 60)
mqtt_client.loop_start()

# -----------------------------
# Paramètres
# -----------------------------
YOLO_CONF = 0.35
CLASS_CONF = 0.80
PRED_INTERVAL = 0.15
CONSENSUS = 3
STICKY_TIMEOUT = 1.5
NONE_INTERVAL = 2.0

last_pred_time = 0
consecutive_label = None
consecutive_count = 0
last_display_box = None
last_display_label = None
last_display_conf = 0.0
last_display_time = 0.0
last_none_publish = 0.0

# -----------------------------
# Webcam
# -----------------------------
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("❌ Impossible d'ouvrir la webcam.")
print("🎬 Webcam démarrée — 'q' pour quitter.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = yolo(frame, verbose=False)
    r = results[0]
    boxes = r.boxes.xyxy.cpu().numpy() if hasattr(r.boxes, "xyxy") else np.array([])
    scores = r.boxes.conf.cpu().numpy() if hasattr(r.boxes, "conf") else np.array([])

    valid_idx = [i for i, box in enumerate(boxes) if float(scores[i]) >= YOLO_CONF and is_date_box(box, frame)]

    if len(valid_idx) == 0:
        now = time.time()
        if last_display_box and (now - last_display_time) <= STICKY_TIMEOUT:
            x1, y1, x2, y2 = last_display_box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
            cv2.putText(frame, f"{last_display_label} ({last_display_conf:.2f})", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        else:
            cv2.putText(frame, "Aucune datte détectee", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            if now - last_none_publish >= NONE_INTERVAL:
                mqtt_client.publish(MQTT_TOPIC, json.dumps({"label": "none", "confidence": 0.0, "timestamp": now}))
                last_none_publish = now
        cv2.imshow("SmartDate", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        continue

    i_best = max(valid_idx, key=lambda i: scores[i])
    x1, y1, x2, y2 = map(int, boxes[i_best])
    roi = frame[y1:y2, x1:x2].copy()
    if roi.size == 0:
        continue

    now = time.time()
    if now - last_pred_time < PRED_INTERVAL:
        continue

    img_input = preprocess_image(roi)
    preds = classifier.predict(img_input, verbose=0)[0]
    label_idx = int(np.argmax(preds))
    confidence = float(preds[label_idx])
    label = CLASS_NAMES[label_idx]

    if consecutive_label == label:
        consecutive_count += 1
    else:
        consecutive_label = label
        consecutive_count = 1
    last_pred_time = now

    should_publish = confidence >= CLASS_CONF and consecutive_count >= CONSENSUS

    last_display_box = (x1, y1, x2, y2)
    last_display_label = label
    last_display_conf = confidence
    last_display_time = now

    color = (0, 255, 0) if confidence >= CLASS_CONF else (0, 165, 255)
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
    cv2.putText(frame, f"{label} ({confidence:.2f})", (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    if should_publish:
        mqtt_client.publish(MQTT_TOPIC, json.dumps({"label": label, "confidence": round(confidence, 3), "timestamp": now}))
        print(f"🏷️ PUBLISHED -> {label} ({confidence:.3f})")
        consecutive_label = None
        consecutive_count = 0

    cv2.imshow("SmartDate", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("👋 Capture terminée.")
