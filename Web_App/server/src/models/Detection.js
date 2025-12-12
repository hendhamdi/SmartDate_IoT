// src/models/Detection.js
import mongoose from "mongoose";

const DetectionSchema = new mongoose.Schema({
  label: String,
  confidence: Number,
  timestamp: Number,
  temp: Number,
  humidity: Number,
  imageUrl: String, // optional
  raw: Object
}, { timestamps: true });

export default mongoose.model("Detection", DetectionSchema);
