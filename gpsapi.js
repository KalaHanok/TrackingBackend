// const axios = require("axios");
// const mqtt = require("mqtt");

// // ---------------- MQTT CONNECTION -------------------- //
// const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");

// mqttClient.on("connect", () => {
//   console.log("Connected to HiveMQ MQTT broker");
// });

// // ------------- FUNCTION TO FETCH DATA FROM API ---------------- //

// async function fetchVehicleData() {
//   try {
//     const url = "https://tbtrack.in/gps/public/api/v1/vehicles/location/data";

//     // ADDING THE REQUIRED HEADER (username)
//     const response = await axios.get(url, {
//       headers: {
//         username: "trackvehicles", // <-- REQUIRED HEADER
//       },
//     });

//     const data = response.data;

//     console.log("Received API Data");

//     // Publish data to MQTT
//     publishToMQTT(data);

//   } catch (error) {
//     console.error("API Error:", error.response?.data || error.message);
//   }
// }

// // ------------- FUNCTION TO PUBLISH DATA TO MQTT ---------------- //

// function publishToMQTT(payload) {
//   const topic = "gps/data";   // Topic to subscribe on your side

//   mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
//     if (!err) {
//       console.log("Data published to MQTT:", topic);
//     } else {
//       console.error("Error publishing MQTT:", err);
//     }
//   });
// }

// // ------------- RUN EVERY 60 SECONDS (API LIMIT: 1/minute) ---------------- //

// setInterval(fetchVehicleData, 60000); // 60 seconds
