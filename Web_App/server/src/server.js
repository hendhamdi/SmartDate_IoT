// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import "./db.js";


import apiRoutes from "./routes/api.js";
import "./services/mqttService.js"; // start mqtt service

dotenv.config();
const app = express();

// =============================
// MIDDLEWARE
// =============================
app.use(cors());
app.use(express.json());

// =============================
// UPLOADS FOLDER (AUTO CREATE)
// =============================
const uploadsDir = path.resolve("uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads folder:", uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));

// =============================
// API ROUTES
// =============================
app.use("/api", apiRoutes);

// =============================
// DB CONNECTION (OPTIONAL)
// =============================
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {})
    .then(() => console.log("✅ Mongo connected"))
    .catch(e => console.warn("⚠️ MongoDB connection failed:", e.message));
}

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
