// // // publish.js
// const mqtt = require("mqtt");

// // Function to return fixed date (Dec 18, 2025) with current IST time
// function getISTDateTime() {
//   const ist = new Date(
//     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//   );

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
//     const messages = [
//       {
//         deviceId: "C3:00:00:51:50:A7",
//         gatewayId: "GW_G_ZONE_G",
//         timestamp: getISTDateTime(),
//         rssi: -49,
//         txPower: -4,
//         accelerometer: { x: 0.22, y: -0.75, z: 9.55 },
//         batteryLevel: 88 + Math.floor(Math.random() * 3),
//         status: "active"
//       },
//       {
//         deviceId: "C3:00:00:51:50:A7",
//         gatewayId: "GW_B_ZONE_B",
//         timestamp: getISTDateTime(),
//         rssi: -46,
//         txPower: -4,
//         accelerometer: { x: 0.19, y: -0.68, z: 9.40 },
//         batteryLevel: 86 + Math.floor(Math.random() * 3),
//         status: "active"
//       },
//       {
//         deviceId: "C3:00:00:51:50:A7",
//         gatewayId: "GW_E_ZONE_E",
//         timestamp: getISTDateTime(),
//         rssi: -54,
//         txPower: -4,
//         accelerometer: { x: 0.14, y: -0.61, z: 9.30 },
//         batteryLevel: 84 + Math.floor(Math.random() * 3),
//         status: "active"
//       }
//     ];

//     messages.forEach(msg => {
//       client.publish("beacons/data", JSON.stringify(msg), { qos: 0 }, err => {
//         if (err) {
//           console.error("❌ Publish error:", err);
//         } else {
//           console.log(
//             "📤 Published:",
//             msg.deviceId,
//             msg.gatewayId,
//             "RSSI:",
//             msg.rssi,
//             msg.timestamp
//           );
//         }
//       });
//     });

//   }, 30000); // every 30 seconds
// });



// //subscribe.js
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


