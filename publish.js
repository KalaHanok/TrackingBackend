// // publish.js
// const mqtt = require("mqtt");

// // Function to return IST timestamp
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

// // Connect to HiveMQ public broker
// const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// client.on("connect", () => {
//   console.log("✅ Connected to MQTT broker");

//   setInterval(() => {
//     // Prepare test messages for beacon_005 (Gateways A, B, C)
//     const messages = [
//       {
//         deviceId: "beacon_005",
//         gatewayId: "Gateway-A1",
//         timestamp: getISTDateTime(),
//         rssi: -20,
//         txPower: -4,
//         accelerometer: { x: 0.12, y: -0.88, z: 9.61 },
//         batteryLevel: 92 + Math.floor(Math.random() * 3),
//         status: "active"
//       },
//       {
//         deviceId: "beacon_005",
//         gatewayId: "Gateway-A2",
//         timestamp: getISTDateTime(),
//         rssi: -20,
//         txPower: -4,
//         accelerometer: { x: 0.15, y: -0.82, z: 9.41 },
//         batteryLevel: 90 + Math.floor(Math.random() * 3),
//         status: "active"
//       },
//       {
//         deviceId: "beacon_005",
//         gatewayId: "Gateway-A3",
//         timestamp: getISTDateTime(),
//         rssi: -15,
//         txPower: -4,
//         accelerometer: { x: 0.18, y: -0.79, z: 9.31 },
//         batteryLevel: 89 + Math.floor(Math.random() * 3),
//         status: "active"
//       }
//     ];

//     // Publish each message
//     messages.forEach(msg => {
//       client.publish("beacons/data", JSON.stringify(msg), { qos: 0 }, (err) => {
//         if (err) {
//           console.error("❌ Publish error:", err);
//         } else {
//           console.log("📤 Published:", msg.deviceId, msg.gatewayId, msg.timestamp);
//         }
//       });
//     });

//   }, 30000); // every 30 seconds
// });

// // // subscribe.js
// // const mqtt = require("mqtt");
// // const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// // client.on("connect", () => {
// //   console.log("Connected. Listening for beacons/data...\n");
// //   client.subscribe("beacons/data");
// // });

// // client.on("message", (topic, message) => {
// //   try {
// //     const data = JSON.parse(message.toString());
// //     console.log(JSON.stringify(data, null, 2)); // pretty-print JSON
// //   } catch {
// //     console.log(message.toString()); // print raw message if not JSON
// //   }
// // });


