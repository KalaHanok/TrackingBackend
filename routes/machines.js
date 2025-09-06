// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");

// // ✅ Get all machines
// router.get("/", (req, res) => {
//   const sql = "SELECT id, name, role, description, image FROM machines";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     res.json(results);
//   });
// });

// // ✅ Add new machine
// router.post("/", (req, res) => {
//   const { name, role, description, image } = req.body;

//   if (!name) return res.status(400).json({ error: "Name is required" });

//   const sql =
//     "INSERT INTO machines (name, role, description, image) VALUES (?, ?, ?, ?)";
//   db.query(sql, [name, role, description, image], (err, result) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     res.status(201).json({ message: "Machine added", id: result.insertId });
//   });
// });

// // ✅ Get machine by ID with logs + beacon
// router.get("/:id", (req, res) => {
//   const machineId = req.params.id;

//   const machineSql = "SELECT * FROM machines WHERE id = ?";
//   const logsSql = `
//     SELECT id, machine_id, current_location, hours_worked, fuel_consumption,
//            material_processed, state, latitude, longitude, log_date
//     FROM machine_logs
//     WHERE machine_id = ?
//     ORDER BY log_date;
//   `;
//   const beaconSql = `
//     SELECT id, machine_id, deviceId, timestamp, accel_x, accel_y, accel_z,
//            rssi, txPower, batteryLevel, status, latitude, longitude
//     FROM machine_beacon_data
//     WHERE machine_id = ?
//     ORDER BY timestamp DESC
//     LIMIT 1;
//   `;

//   db.query(machineSql, [machineId], (err, machineResults) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     if (machineResults.length === 0)
//       return res.status(404).json({ error: "Machine not found" });

//     db.query(logsSql, [machineId], (err2, logResults) => {
//       if (err2) return res.status(500).json({ error: "Database error" });

//       db.query(beaconSql, [machineId], (err3, beaconResults) => {
//         if (err3) return res.status(500).json({ error: "Database error" });

//         res.json({
//           machine: machineResults[0],
//           logs: logResults,
//           beacon: beaconResults.length ? beaconResults[0] : null,
//         });
//       });
//     });
//   });
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Ensure uploads folder exists
// const uploadDir = "uploads/";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // Multer storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     // Generate file name based on next machine id
//     db.query("SELECT MAX(id) AS maxId FROM machines", (err, result) => {
//       if (err) {
//         console.error("DB error while generating filename:", err);
//         return cb(err);
//       }
//       const nextId = (result[0].maxId || 0) + 1;
//       const ext = path.extname(file.originalname);
//       const fileName = `machine${nextId}${ext}`;
//       cb(null, fileName);
//     });
//   },
// });

// const upload = multer({ storage });

// // ✅ Get all machines
// router.get("/", (req, res) => {
//   const sql = "SELECT id, name, role, description, image FROM machines";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     res.json(results);
//   });
// });

// // ✅ Add new machine
// router.post("/", upload.single("image"), (req, res) => {
//   const { name, role, description } = req.body;
//   if (!name) return res.status(400).json({ error: "Name is required" });

//   const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

//   const sql = `
//     INSERT INTO machines (name, role, description, image)
//     VALUES (?, ?, ?, ?)
//   `;
//   db.query(sql, [name, role, description, imageUrl], (err, result) => {
//     if (err) {
//       console.error("Error inserting machine:", err);
//       return res.status(500).json({ error: "Database error" });
//     }
//     res.status(201).json({ message: "Machine added", id: result.insertId });
//   });
// });

// // ✅ Get machine by ID with logs + beacon
// router.get("/:id", (req, res) => {
//   const machineId = req.params.id;

//   const machineSql = "SELECT * FROM machines WHERE id = ?";
//   const logsSql = `
//     SELECT id, machine_id, current_location, hours_worked, fuel_consumption,
//            material_processed, state, latitude, longitude, log_date
//     FROM machine_logs
//     WHERE machine_id = ?
//     ORDER BY log_date;
//   `;
//   const beaconSql = `
//     SELECT id, machine_id, deviceId, timestamp, accel_x, accel_y, accel_z,
//            rssi, txPower, batteryLevel, status, latitude, longitude
//     FROM machine_beacon_data
//     WHERE machine_id = ?
//     ORDER BY timestamp DESC
//     LIMIT 1;
//   `;

//   db.query(machineSql, [machineId], (err, machineResults) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     if (machineResults.length === 0)
//       return res.status(404).json({ error: "Machine not found" });

//     db.query(logsSql, [machineId], (err2, logResults) => {
//       if (err2) return res.status(500).json({ error: "Database error" });

//       db.query(beaconSql, [machineId], (err3, beaconResults) => {
//         if (err3) return res.status(500).json({ error: "Database error" });

//         res.json({
//           machine: machineResults[0],
//           logs: logResults,
//           beacon: beaconResults.length ? beaconResults[0] : null,
//         });
//       });
//     });
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mqtt = require("mqtt"); // ✅ MQTT Integration

// Ensure uploads folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    db.query("SELECT MAX(id) AS maxId FROM machines", (err, result) => {
      if (err) return cb(err);
      const nextId = (result[0].maxId || 0) + 1;
      const ext = path.extname(file.originalname);
      cb(null, `machine${nextId}${ext}`);
    });
  },
});

const upload = multer({ storage });

// ==================== EXPRESS ROUTES ==================== //

// Get all machines
router.get("/", (req, res) => {
  const sql = "SELECT id, name, role, description, image FROM machines";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// Add new machine
router.post("/", upload.single("image"), (req, res) => {
  const { name, role, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const sql = "INSERT INTO machines (name, role, description, image) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, role, description, imageUrl], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(201).json({ message: "Machine added", id: result.insertId });
  });
});

// Get machine by ID with logs + latest beacon
router.get("/:id", (req, res) => {
  const machineId = req.params.id;

  const machineSql = "SELECT * FROM machines WHERE id = ?";
  const logsSql = `
    SELECT id, machine_id, current_location, hours_worked, fuel_consumption,
           material_processed, state, latitude, longitude, log_date
    FROM machine_logs
    WHERE machine_id = ?
    ORDER BY log_date;
  `;
  const beaconSql = `
    SELECT id, machine_id, deviceId, timestamp, accel_x, accel_y, accel_z,
           rssi, txPower, batteryLevel, status, latitude, longitude
    FROM machine_beacon_data
    WHERE machine_id = ?
    ORDER BY timestamp DESC
    LIMIT 1;
  `;

  db.query(machineSql, [machineId], (err, machineResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!machineResults.length) return res.status(404).json({ error: "Machine not found" });

    db.query(logsSql, [machineId], (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(beaconSql, [machineId], (err3, beaconResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        res.json({
          machine: machineResults[0],
          logs: logResults,
          beacon: beaconResults.length ? beaconResults[0] : null,
        });
      });
    });
  });
});

module.exports = router;

// ==================== MQTT INTEGRATION ==================== //

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Example fixed gateway coordinates (lat/lon)
const gatewayCoords = {
  gateway_A: { lat: 15.585108, lon: 79.825956 },
  gateway_B: { lat: 15.585979, lon: 79.826868 },
  gateway_C: { lat: 15.585958, lon: 79.825935 },
  gateway_D: { lat: 15.586149, lon: 79.826879 }
};

// RSSI → distance
function rssiToDistance(rssi, txPower = -59, n = 2.5) {
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

// Weighted centroid method (lat/lon)
function estimatePosition(gatewayReadings, txPower = -59, n = 2.5) {
  let lat = 0, lon = 0, totalWeight = 0;
  for (const r of gatewayReadings) {
    const dist = rssiToDistance(r.rssi, txPower, n);
    const weight = 1 / dist;
    lat += r.lat * weight;
    lon += r.lon * weight;
    totalWeight += weight;
  }
  return { latitude: lat / totalWeight, longitude: lon / totalWeight };
}

// MQTT connect & subscribe
client.on("connect", () => {
  console.log("✅ Connected to HiveMQ public broker");
  client.subscribe("beacons/data", (err) => {
    if (err) console.error("❌ Subscription error:", err);
    else console.log("📡 Subscribed to beacons/data");
  });
});

// Handle incoming messages
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 Beacon MQTT data:", data);

    // ----------------- DAILY ROW LOGIC ----------------- //
    const checkSql = `
      SELECT id FROM machine_beacon_data
      WHERE deviceId = ?
      AND DATE(timestamp) = CURDATE()
      LIMIT 1
    `;

    db.query(checkSql, [data.deviceId], (err, results) => {
      if (err) return console.error("❌ DB Check Error:", err);

      if (results.length > 0) {
        // Update today’s row
        const updateSql = `
          UPDATE machine_beacon_data
          SET gatewayId = ?, accel_x = ?, accel_y = ?, accel_z = ?,
              rssi = ?, txPower = ?, batteryLevel = ?, status = ?,
              latitude = ?, longitude = ?, timestamp = ?
          WHERE id = ?
        `;
        db.query(updateSql, [
          data.gatewayId,
          data.accelerometer?.x || 0,
          data.accelerometer?.y || 0,
          data.accelerometer?.z || 0,
          data.rssi,
          data.txPower,
          data.batteryLevel,
          data.status,
          data.latitude,
          data.longitude,
          data.timestamp,
          results[0].id
        ], (err2) => {
          if (err2) console.error("❌ DB Update Error:", err2);
          else console.log("🔄 Beacon data updated for today");
          runTriangulation(data.deviceId);
        });

      } else {
        // Insert new row for new day
        const insertSql = `
          INSERT INTO machine_beacon_data 
          (machine_id, deviceId, gatewayId, timestamp, accel_x, accel_y, accel_z,
           rssi, txPower, batteryLevel, status, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(insertSql, [
          data.machine_id,
          data.deviceId,
          data.gatewayId,
          data.timestamp,
          data.accelerometer?.x || 0,
          data.accelerometer?.y || 0,
          data.accelerometer?.z || 0,
          data.rssi,
          data.txPower,
          data.batteryLevel,
          data.status,
          data.latitude,
          data.longitude
        ], (err3) => {
          if (err3) console.error("❌ DB Insert Error:", err3);
          else console.log("✅ New row created for today’s beacon data");
          runTriangulation(data.deviceId);
        });
      }
    });
  } catch (err) {
    console.error("❌ MQTT JSON Parse Error:", err.message);
  }
});

// ----------------- TRIANGULATION ----------------- //
function runTriangulation(deviceId) {
  const query = `
    SELECT gatewayId, rssi, txPower
    FROM machine_beacon_data
    WHERE deviceId = ?
    AND DATE(timestamp) = CURDATE()
    ORDER BY timestamp DESC
    LIMIT 4
  `;
  db.query(query, [deviceId], (err, results) => {
    if (err) return console.error("❌ Triangulation DB error:", err);

    if (results.length >= 3) {
      const readings = results.map(r => {
        const g = gatewayCoords[r.gatewayId];
        return { lat: g.lat, lon: g.lon, rssi: r.rssi, txPower: r.txPower };
      });
      const { latitude, longitude } = estimatePosition(readings);
      console.log(`📍 Estimated Location of ${deviceId}: lat=${latitude.toFixed(6)}, lon=${longitude.toFixed(6)}`);
    } else console.log("⚠️ Not enough gateways for triangulation");
  });
}






