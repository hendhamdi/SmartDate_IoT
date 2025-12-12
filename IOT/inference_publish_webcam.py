import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import os
import time
import json
import base64
import paho.mqtt.client as mqtt
import ssl
from dotenv import load_dotenv
from pathlib import Path


# =============================
#  Charger ENV
# =============================
load_dotenv()

BROKER_HOST = os.getenv("BROKER_HOST")
BROKER_PORT = int(os.getenv("BROKER_PORT", 8883))
BROKER_USER = os.getenv("BROKER_USER")
BROKER_PASS = os.getenv("BROKER_PASS")
MQTT_TOPIC = os.getenv("TOPIC", "smartdate/detections")

print("MQTT CONFIG:")
print(BROKER_HOST, BROKER_PORT, MQTT_TOPIC)


# =============================
#  YOLO
# =============================
from ultralytics import YOLO
yolo = YOLO("yolov8n.pt")
print("✅ YOLOv8 chargé")


# =============================
#  CLASSIFIER
# =============================
MODEL_PATH = Path(__file__).parent / "../models/smartdate_efficientnetb3.keras"
classifier = load_model(str(MODEL_PATH), compile=False)
print("✅ EfficientNet chargé")


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


# =============================
#  MQTT SETUP
# =============================
def on_connect(client, userdata, flags, rc):
    print("✅ MQTT CONNECTED" if rc == 0 else f"❌ MQTT ERROR {rc}")

mqtt_client = mqtt.Client(client_id="smartdate_pub", protocol=mqtt.MQTTv311)
mqtt_client.username_pw_set(BROKER_USER, BROKER_PASS)
mqtt_client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
mqtt_client.on_connect = on_connect
mqtt_client.connect(BROKER_HOST, BROKER_PORT, 60)
mqtt_client.loop_start()


# =============================
#  PARAMÈTRES
# =============================
YOLO_CONF = 0.4
CLASS_CONF = 0.80
PRED_INTERVAL = 0.3
CONSENSUS = 3

last_pred = 0
consecutive_label = None
consecutive_count = 0


# =============================
#  WEBCAM
# =============================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("❌ WEBCAM INTROUVABLE")
    exit()

print("✅ WEBCAM OK — appuie sur Q pour quitter")


# =============================
#  BOUCLE PRINCIPALE
# =============================
while True:

    ret, frame = cap.read()
    if not ret:
        continue

    results = yolo(frame, verbose=False)[0]
    boxes = results.boxes.xyxy.cpu().numpy()
    scores = results.boxes.conf.cpu().numpy()

    valid = [(i, scores[i]) for i in range(len(boxes)) if scores[i] >= YOLO_CONF]

    now = time.time()

    if not valid:
        cv2.putText(frame, "Aucune datte detectee", (30,40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255),2)
        cv2.imshow("SmartDate", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
        continue


    best = max(valid, key=lambda x: x[1])[0]
    x1,y1,x2,y2 = map(int, boxes[best])
    roi = frame[y1:y2, x1:x2]

    if roi.size == 0:
        continue

    if now - last_pred < PRED_INTERVAL:
        continue


    # =============================
    #  CLASSIFICATION
    # =============================
    img_input = preprocess_image(roi)
    preds = classifier.predict(img_input, verbose=0)[0]

    idx = np.argmax(preds)
    label = CLASS_NAMES[idx]
    confidence = float(preds[idx])
    last_pred = now


    # =============================
    #  STABILISATION
    # =============================
    if label == consecutive_label:
        consecutive_count += 1
    else:
        consecutive_label = label
        consecutive_count = 1

    should_publish = confidence >= CLASS_CONF and consecutive_count >= CONSENSUS


    # =============================
    #  AFFICHAGE LOCAL
    # =============================
    color = (0,255,0) if confidence >= CLASS_CONF else (0,140,255)
    cv2.rectangle(frame,(x1,y1),(x2,y2),color,3)
    cv2.putText(frame,f"{label} ({confidence:.2f})",
                (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX,0.8,color,2)


    # =============================
    #  ENVOI MQTT AVEC IMAGE
    # =============================
    if should_publish:

        _, jpg = cv2.imencode(".jpg", roi)
        image_base64 = base64.b64encode(jpg).decode("utf-8")

        recommendation = (
            "✅ Excellente qualité — prête pour le marché"
            if confidence >= 0.85 else
            "⚠️ Qualité moyenne — tri recommandé"
        )

        payload = {
            "label": label,
            "confidence": round(confidence, 3),
            "timestamp": now,
            "image": image_base64,
            "recommendation": recommendation
        }

        mqtt_client.publish(MQTT_TOPIC, json.dumps(payload))
        print("✅ PUBLISHED MQTT")

        consecutive_label = None
        consecutive_count = 0


    cv2.imshow("SmartDate", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# =============================
#  CLEAN EXIT
# =============================
cap.release()
cv2.destroyAllWindows()
mqtt_client.disconnect()
print("👋 SmartDate fermé proprement")
