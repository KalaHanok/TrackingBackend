// // mqtt_publisher.js
// const mqtt = require("mqtt");

// // Connect to HiveMQ public broker
// const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// client.on("connect", () => {
//   console.log("✅ Connected to MQTT broker");

//   // Example: publish every 5 seconds
//   setInterval(() => {
//     const timestamp = new Date().toISOString();
//     const testData = {
//       truck_id: 1,
//       device_id: "DEV123",
//       timestamp: timestamp,
//       latitude: 15.586000 + Math.random() * 0.001,
//       longitude: 79.826000 + Math.random() * 0.001,
//       altitude: 10,
//       speed_kmph: Math.floor(Math.random() * 80),
//       heading_degrees: Math.floor(Math.random() * 360),
//       ignition: 1,
//       battery_level: 90,
//       signal_strength: -70,
//       gps_fix: 1,
//       event_type: "normal",
//       event_description: "Test GPS data",
//       geofence_alert: 0
//     };

//     client.publish("gps/data", JSON.stringify(testData), { qos: 0 }, (err) => {
//       if (err) console.error("❌ Publish error:", err);
//       else console.log("📤 Published test data:", testData);
//     });
//   }, 5000); // every 5 seconds
// });

// client.on("error", (err) => {
//   console.error("❌ MQTT connection error:", err);
// });
