// // mqtt_subscriber.js
// const mqtt = require("mqtt");

// // Connect to HiveMQ public broker
// const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// client.on("connect", () => {
//   console.log("✅ Connected to MQTT broker");

//   // Subscribe to the topic you want to monitor
//   client.subscribe("gps/data", (err) => {
//     if (err) console.error("❌ Subscription error:", err);
//     else console.log("📡 Subscribed to topic: gps/data");
//   });
// });

// // Listen for incoming messages
// client.on("message", (topic, message) => {
//   try {
//     const data = JSON.parse(message.toString());
//     console.log("📥 Message received on topic", topic, ":\n", data);
//   } catch (err) {
//     console.error("❌ Error parsing MQTT message:", err);
//   }
// });

// client.on("error", (err) => {
//   console.error("❌ MQTT connection error:", err);
// });
