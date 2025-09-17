// function getISTDateTime() {
//   const now = new Date();
//   const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//   const yyyy = ist.getFullYear();
//   const mm = String(ist.getMonth() + 1).padStart(2, "0");
//   const dd = String(ist.getDate()).padStart(2, "0");
//   const hh = String(ist.getHours()).padStart(2, "0");
//   const mi = String(ist.getMinutes()).padStart(2, "0");
//   const ss = String(ist.getSeconds()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
// }

// // mqtt_publisher.js
// const mqtt = require("mqtt");

// // Connect to HiveMQ public broker
// const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// client.on("connect", () => {
//   console.log("✅ Connected to MQTT broker");

//   // Publish test data every 30 seconds
//   setInterval(() => {
//     // Simulated beacon data for 3 beacons from 3 gateways each
//     const testMessages = [
//       // beacon_001
//       {
//         deviceId: "beacon_001",
//         gatewayId: "Gateway-A",
//         timestamp: getISTDateTime(),
//         rssi: -70,
//         txPower: -4,
//         accelerometer: { x: 0.25, y: -0.75, z: 9.45 },
//         batteryLevel: 95,
//         status: "active"
//       },
//       {
//         deviceId: "beacon_001",
//         gatewayId: "Gateway-B",
//         timestamp: getISTDateTime(),
//         rssi: -65,
//         txPower: -4,
//         accelerometer: { x: 0.28, y: -0.72, z: 9.42 },
//         batteryLevel: 94,
//         status: "active"
//       },
//       {
//         deviceId: "beacon_001",
//         gatewayId: "Gateway-C",
//         timestamp: getISTDateTime(),
//         rssi: -60,
//         txPower: -4,
//         accelerometer: { x: 0.30, y: -0.70, z: 9.40 },
//         batteryLevel: 93,
//         status: "active"
//       },

//       // beacon_002
//       {
//         deviceId: "beacon_002",
//         gatewayId: "Gateway-A",
//         timestamp: getISTDateTime(),
//         rssi: -68,
//         txPower: -4,
//         accelerometer: { x: 0.35, y: -0.65, z: 9.55 },
//         batteryLevel: 92,
//         status: "active"
//       },
//       {
//         deviceId: "beacon_002",
//         gatewayId: "Gateway-B",
//         timestamp: getISTDateTime(),
//         rssi: -64,
//         txPower: -4,
//         accelerometer: { x: 0.37, y: -0.63, z: 9.52 },
//         batteryLevel: 91,
//         status: "active"
//       },
//       {
//         deviceId: "beacon_002",
//         gatewayId: "Gateway-C",
//         timestamp: getISTDateTime(),
//         rssi: -61,
//         txPower: -4,
//         accelerometer: { x: 0.39, y: -0.61, z: 9.50 },
//         batteryLevel: 90,
//         status: "active"
//       },

//       // beacon_005 (your original one)
//       {
//         deviceId: "beacon_005",
//         gatewayId: "Gateway-A",
//         timestamp: getISTDateTime(),
//         rssi: -72,
//         txPower: -4,
//         accelerometer: { x: 0.12, y: -0.88, z: 9.61 },
//         batteryLevel: 94,
//         status: "active"
//       },
//       {
//         deviceId: "beacon_005",
//         gatewayId: "Gateway-B",
//         timestamp: getISTDateTime(),
//         rssi: -63,
//         txPower: -4,
//         accelerometer: { x: 0.15, y: -0.82, z: 9.41 },
//         batteryLevel: 93,
//         status: "active"
//       },
//       {
//         deviceId: "beacon_005",
//         gatewayId: "Gateway-C",
//         timestamp: getISTDateTime(),
//         rssi: -52,
//         txPower: -4,
//         accelerometer: { x: 0.18, y: -0.79, z: 9.31 },
//         batteryLevel: 92,
//         status: "active"
//       }
//     ];

//     // Publish each message separately to simulate real multi-gateway data
//     testMessages.forEach(msg => {
//       client.publish("beacons/data", JSON.stringify(msg), { qos: 0 }, (err) => {
//         if (err) {
//           console.error("❌ Publish error:", err);
//         } else {
//           console.log("📤 Published:", msg.deviceId, msg.gatewayId, msg);
//         }
//       });
//     });

//   }, 30000); // every 30 seconds
// });
