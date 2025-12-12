// src/routes/api.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Detection from "../models/Detection.js";
import { getLatest, isMqttConnected } from "../services/mqttService.js";

const router = express.Router();


// =============================
// STORAGE CONFIG
// =============================
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 uploads/ directory created");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const name = `det_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, name);
  }
});

const upload = multer({ storage });



// =============================
// API STATUS
// =============================
router.get("/", (req, res) => {
  res.json({ message: "✅ API WORKING", time: new Date() });
});


// =============================
// HEALTH CHECK
// =============================
router.get("/health", (req, res) => {
  res.json({
    backend: true,
    mqtt: isMqttConnected()
  });
});


// =============================
//  LATEST DETECTION (MQTT CACHE)
// =============================
router.get("/latest", (req, res) => {

  const latest = getLatest();

  if (!latest) {
    return res.status(404).json({ error: "no data yet" });
  }

  res.json(latest);
});


// =============================
// HISTORY
// =============================
router.get("/history", async (req, res) => {

  if (!process.env.MONGO_URI) {
    return res.json([]);
  }

  try {
    const docs = await Detection.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(docs);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// =============================
// STATS
// =============================
router.get("/stats", async (req, res) => {

  if (!process.env.MONGO_URI) {
    return res.json({});
  }

  try {

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const total = await Detection.countDocuments();
    const today = await Detection.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const avg = await Detection.aggregate([
      { $group: { _id: null, avg: { $avg: "$confidence" } } }
    ]);

    const byType = await Detection.aggregate([
      { $group: { _id: "$label", count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      today,
      avgConfidence: avg[0]?.avg || 0,
      byType
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// =============================
// IMAGE UPLOAD
// =============================
router.post("/upload", upload.single("image"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "no file" });
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ ok: true, url });

});


export default router;
