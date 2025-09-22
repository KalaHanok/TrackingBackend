const mqtt = require("mqtt");
const express = require("express");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883"); // your broker
const app = express();
const PORT = process.env.PORT || 5000;

const TOPIC = "beacons/data";
let lastMessageTime = Date.now();
const TIMEOUT = 30000; // 30 seconds
let isDataAlive = true;

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  client.subscribe(TOPIC, (err) => {
    if (!err) console.log(`📡 Subscribed to ${TOPIC}`);
  });
});

client.on("message", (topic, message) => {
  console.log(`📥 Received: ${message.toString()}`);
  lastMessageTime = Date.now();
  isDataAlive = true; // got data, so mark alive
});

// ⏱️ Check every 30s
setInterval(() => {
  if (Date.now() - lastMessageTime > TIMEOUT) {
    isDataAlive = false; // no data
    console.log("🚨 ALERT: No data received from MQTT broker!");
  } else {
    isDataAlive = true;
  }
}, 30000);

// 🚨 API for frontend to check
app.get("/mqtt-status", (req, res) => {
  res.json({ alive: isDataAlive });
});

app.listen(PORT, () => {
  console.log(`🌐 MQTT test server running on port ${PORT}`);
});
