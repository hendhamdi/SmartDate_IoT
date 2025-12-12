import mqtt from "mqtt";
import dotenv from "dotenv";
dotenv.config();

const client = mqtt.connect({
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  protocol: "mqtts",
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD
});

export default client;
