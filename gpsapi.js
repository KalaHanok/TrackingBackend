// require("dotenv").config();
// const axios = require("axios");
// const mqtt = require("mqtt");
// const db = require("./config/db");

// // MQTT client
// const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");

// mqttClient.on("connect", () => {
//   console.log("Connected to HiveMQ MQTT broker");
// });

// // Fetch API data every 30 sec
// async function fetchVehicleData() {
//   try {
//     const response = await axios.get(
//       "https://app.gpstrack.in/api/get_current_data?token=s4jOxNwBgFRoG9DzUGrXsN3ZkmLnDQ14&email=ts07hk1061api@gpstrack.in"
//     );

//     console.log("Received API Data");

//     if (!response.data || !Array.isArray(response.data)) {
//       console.error("❌ API format invalid");
//       return;
//     }

//     publishToMQTT(response.data);

//   } catch (error) {
//     console.error("API Error:", error.response?.data || error.message);
//   }
// }

// // PUBLISH FUNCTION
// function publishToMQTT(vehicles) {
//   const topic = "gps/data";

//   vehicles.forEach((v) => {
//     const vehicleNoFromAPI = v.regNo;  // Match using AP28TC9585

//     if (!vehicleNoFromAPI) {
//       console.log("⚠️ regNo missing in API data");
//       return;
//     }

//     // Match MySQL using vehicle_no (NOT device_id)
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

//       // Use internal system device_id (example: TTGO_GPS_TRACKER_1)
//       const deviceId = result[0].device_id;

//       // Format timestamp
//       let timestamp = v.isoDate;
//       if (timestamp) {
//         timestamp = timestamp.replace("T", " ").split(".")[0];
//       } else {
//         timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
//       }

//       // MQTT Payload
//       const mqttPayload = {
//         device_id: deviceId,   // use your internal device ID (not API deviceId)
//         timestamp: timestamp,
//         location: {
//           latitude: v.latitude || 0,
//           longitude: v.longitude || 0,
//           altitude: 0,
//           speed_kmph: v.speed || 0,
//           heading_degrees: v.bearing || 0,
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

//       mqttClient.publish(
//         topic,
//         JSON.stringify(mqttPayload),
//         { qos: 1 },
//         (err) => {
//           if (!err) {
//             console.log(`Published to MQTT for ${vehicleNoFromAPI} -> ${deviceId}`);
//           } else {
//             console.error("MQTT Publish Error:", err);
//           }
//         }
//       );
//     });
//   });
// }

// // Run every 30 seconds
// setInterval(fetchVehicleData, 30000);

// console.log("GPS API Service Started...");
