const express = require("express");
const cors = require("cors");
const path = require("path");
const mqtt = require("mqtt");

require("dotenv").config();
require("./gpsapi");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const workerRoutes = require("./routes/workers");
app.use("/api/workers", workerRoutes);

const truckRoutes = require("./routes/trucks");
app.use("/api/trucks", truckRoutes);

const machinesRoutes = require("./routes/machines");
app.use("/machines", machinesRoutes);

const trackingRoutes = require("./routes/tracking");
app.use("/api/tracking", trackingRoutes);

const v1AuthRoutes = require("./routes/v1/auth");
const v1WorkerRoutes = require("./routes/v1/workers");
const v1TruckRoutes = require("./routes/v1/trucks");
const v1MachinesRoutes = require("./routes/v1/machines");
const v1TrackingRoutes = require("./routes/v1/tracking");

app.use("/api/v1/auth", v1AuthRoutes);
app.use("/api/v1/workers", v1WorkerRoutes);
app.use("/api/v1/trucks", v1TruckRoutes);
app.use("/api/v1/machines", v1MachinesRoutes);
app.use("/api/v1/tracking", v1TrackingRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const client = mqtt.connect("mqtt://broker.hivemq.com:1883"); // your broker
const TOPIC = "beacons/data";

let lastMessageTime = Date.now();
const TIMEOUT = 30000; // 30 seconds
let isDataAlive = true;

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  client.subscribe(TOPIC, (err) => {
    if (!err) console.log(`📡 Subscribed to ${TOPIC}`);
  });
});

client.on("message", (topic, message) => {
  console.log(`📥 Received: ${message.toString()}`);
  lastMessageTime = Date.now();
  isDataAlive = true; // got data, so mark alive
});

// Check every 30s if MQTT data is alive
setInterval(() => {
  if (Date.now() - lastMessageTime > TIMEOUT) {
    isDataAlive = false;
    console.log("🚨 ALERT: No data received from MQTT broker!");
  } else {
    isDataAlive = true;
  }
}, 30000);

// API for frontend to check MQTT status
app.get("/mqtt-status", (req, res) => {
  res.json({ alive: isDataAlive });
});


// Start Server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
