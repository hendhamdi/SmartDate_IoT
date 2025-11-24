# 🌴 SmartDate IoT — Classification des Dattes Deglet Nour

### 🌍 Projet universitaire — Mini-Projet IoT Partie 1 et 2

---

## 📖 Présentation

**SmartDate IoT** est un système intelligent de **classification automatique des dattes Deglet Nour** basé sur un modèle de **Deep Learning avancé (EfficientNetB3)** et intégré dans une **architecture IoT simulée**.  
L’objectif est de reconnaître automatiquement 11 types de dattes à partir d’images capturées par webcam ou issues d’un dataset, puis de publier les résultats en temps réel via **MQTT** vers un **dashboard web interactif**.

---

## 🧠 Objectifs

1. Concevoir un modèle DL **hautement performant** pour classifier les dattes.
2. Intégrer ce modèle dans une chaîne IoT connectée.
3. Simuler la communication entre le capteur (webcam), le cloud (broker MQTT) et l’interface web.
4. Fournir un outil d’aide à la décision pour la valorisation des produits agricoles tunisiens.

---

## 🧩 Architecture du projet

```plaintext
SmartDate-IoT/
│
├── Colab_Notebooks/                     → Entraînement du modèle sur Google Colab (Partie 1)
├── Date_Dataset/                        → Images (train / validation / test)
├── Docs/                                → Rapports, captures, documentation
├── IOT/                                 → Scripts MQTT (publisher/subscriber) (Partie 2)
├── Web_Dashboard/                       → Interface web de visualisation (Partie 3)
│
├── models/
|   └── smartdate_efficientnetb3.keras   → Modèle entraîné sauvegardé
└── README.md
 ```

 ---
 ## 🔍 Fonctionnalités principales

✅ **Classification en temps réel via webcam**  
→ Capture directe depuis PC, traitement local et affichage instantané.

☁️ **Publication MQTT simulée (IoT)**  
→ Envoi automatique des résultats vers un broker (Mosquitto ou HiveMQ).

📊 **Dashboard web dynamique**  
→ Affiche les prédictions, l’historique et les recommandations automatiques.

💡 **Recommandations intelligentes**
Exp:
- Type 3 → adapté à l’exportation.  
- Type 8 → à conserver à basse température.

📁 **Historique intelligent**  
→ Sauvegarde de chaque image avec type, date et heure de détection.

---

## ⚙️ Étapes principales

1️⃣ **Phase 1 : Entraînement du modèle** 
- Préparation du dataset et data augmentation.
- Entraînement d’EfficientNetB3 avec fine-tuning et scheduler.
- Sauvegarde du modèle final dans models/smartdate_efficientnetb3.keras.
2️⃣ **Phase 2 : Simulation IoT avec MQTT**
- Configuration du broker MQTT (Mosquitto ou HiveMQ).
- Script Python pour capture webcam + classification + publication en temps réel.

3️⃣ **Phase 3 : Interface web interactive** 
- Dashboard dynamique affichant les résultats en temps réel.
- Historique et recommandations intelligentes.

---

## ⚖️ Licence

Ce projet est distribué sous la **licence MIT** — vous êtes libre de le réutiliser à des fins **éducatives ou personnelles**, à condition de citer l’auteure originale.

---

⭐ **SmartDate IoT : vers une agriculture connectée, intelligente et durable.**