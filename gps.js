// require("dotenv").config();
// const axios = require("axios");
// const mqtt = require("mqtt");

// // MQTT client
// const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");

// mqttClient.on("connect", () => {
//   console.log("Connected to HiveMQ MQTT broker");
// });

// // Fetch API data every 30 sec
// async function fetchVehicleData() {
//   try {
//     const response = await axios.get(
//       "https://app.gpstrack.in/api/get_current_data?token=s4jOxNwBgFRoG9DzUGrXsN3ZkmLnDQ14&email=ts07hk1061api@gpstrack.in",
//       {
//         headers: {
//           username: "trackvehicles",
//         },
//       }
//     );

//     console.log("Received API Data");

//     if (!response.data) {
//       console.error("❌ API returned empty data");
//       return;
//     }

//     // Publish RAW JSON to MQTT
//     publishRawJSON(response.data);

//   } catch (error) {
//     console.error("API Error:", error.response?.data || error.message);
//   }
// }

// // Publish RAW JSON
// function publishRawJSON(rawData) {
//   const topic = "gps/data";

//   const jsonString = JSON.stringify(rawData);

//   mqttClient.publish(topic, jsonString, { qos: 1 }, (err) => {
//     if (!err) {
//       console.log("Published RAW JSON to MQTT");
//     } else {
//       console.error("MQTT Publish Error:", err);
//     }
//   });
// }

// // Run every 30 seconds
// setInterval(fetchVehicleData, 32000);

// console.log("GPS API Service Started...");
