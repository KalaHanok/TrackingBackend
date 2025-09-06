const mqtt = require("mqtt");

//const clientId = "nodeClient_" + Math.random().toString(16).substr(2, 8);

const brokerUrl = "mqtt://broker.hivemq.com:1883"; // TCP for Node.js

const client = mqtt.connect(brokerUrl, {
  //clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  //console.log("✅ Connected to HiveMQ with clientId:", clientId);

  client.subscribe(["gps/data", "beacons/data"], (err) => {
    if (err) console.error("❌ Subscription error:", err);
    else console.log("📡 Subscribed to gps/data & beacons/data");
  });
});

client.on("message", (topic, message) => {
  console.log(`📥 ${topic}:`, message.toString());
});

client.on("error", (err) => {
  console.error("❌ MQTT error:", err);
});
