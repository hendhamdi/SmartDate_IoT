import { getLatestDetection, sendCommand } from "../services/mqttService.js";

export function currentDetection(req, res) {
  res.json(getLatestDetection());
}

export function controlCamera(req, res) {
  const { command } = req.body;
  sendCommand(command);
  res.json({ message: "Commande envoyée", command });
}
