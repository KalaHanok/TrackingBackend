// require("dotenv").config();
// const axios = require("axios");
// const mqtt = require("mqtt");
// const db = require("./config/db");

// // MQTT client
// const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");

// mqttClient.on("connect", () => {
//   console.log("Connected to HiveMQ MQTT broker");
// });

// // Fetch API data every 32 sec
// async function fetchVehicleData() {
//   try {
//     const response = await axios.get(
//       "https://app.gpstrack.in/api/get_current_data?token=s4jOxNwBgFRoG9DzUGrXsN3ZkmLnDQ14&email=ts07hk1061api@gpstrack.in"
//     );

//     console.log("Received API Data");

//     // Validate array format
//     if (!response.data || !Array.isArray(response.data)) {
//       console.error("❌ API format invalid. Expected an array.");
//       return;
//     }

//     // Remove duplicate objects (sometimes API repeats values)
//     const uniqueVehicles = removeDuplicates(response.data);

//     publishToMQTT(uniqueVehicles);

//   } catch (error) {
//     console.error("API Error:", error.response?.data || error.message);
//   }
// }

// // Utility: Remove duplicates based on rowId or regNo
// function removeDuplicates(arr) {
//   const map = new Map();
//   return arr.filter((item) => {
//     if (!map.has(item.rowId)) {
//       map.set(item.rowId, true);
//       return true;
//     }
//     return false;
//   });
// }

// // Publish data to MQTT
// function publishToMQTT(vehicles) {
//   const topic = "gps/data";

//   vehicles.forEach((v) => {
//     const vehicleNoFromAPI = v.regNo;

//     if (!vehicleNoFromAPI) {
//       console.log("⚠️ regNo missing in API data");
//       return;
//     }

//     // Find device_id from your DB using vehicle_no
//     const query = "SELECT device_id FROM truck_devices WHERE vehicle_no = ?";

//     db.query(query, [vehicleNoFromAPI], (err, result) => {
//       if (err) {
//         console.error("❌ Database Error:", err);
//         return;
//       }

//       if (!result.length) {
//         console.log(`⚠️ No device mapped for vehicle_no: ${vehicleNoFromAPI}`);
//         return;
//       }

//       // Internal device ID
//       const deviceId = result[0].device_id;

//       // Timestamp formatting
//       let timestamp = v.isoDate;
//       if (timestamp) {
//         timestamp = timestamp.replace("T", " ").split(".")[0];
//       } else {
//         timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
//       }

//       // MQTT Payload
//       const mqttPayload = {
//         device_id: deviceId,
//         timestamp: timestamp,
//         location: {
//           latitude: v.latitude ?? 0,
//           longitude: v.longitude ?? 0,
//           altitude: 0,
//           speed_kmph: v.speed ?? 0,
//           heading_degrees: v.bearing ?? 0,
//         },
//         status: {
//           ignition: v.ignitionStatus === "ON",
//           battery_level: 100,
//           signal_strength: "10",
//           gps_fix: true,
//         },
//         event: {
//           type: "tracking",
//           description: "GPS position updated",
//           geofence_alert: false,
//         },
//       };

//       // Publish to MQTT
//       mqttClient.publish(topic, JSON.stringify(mqttPayload), { qos: 1 }, (err) => {
//         if (!err) {
//           console.log(`Published to MQTT for ${vehicleNoFromAPI} -> ${deviceId}`);
//         } else {
//           console.error("MQTT Publish Error:", err);
//         }
//       });
//     });
//   });
// }

// setInterval(fetchVehicleData, 32000);

// console.log("GPS API Service Started...");
