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
const mqtt = require("mqtt"); // ✅ NEW

// Ensure uploads folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate file name based on next machine id
    db.query("SELECT MAX(id) AS maxId FROM machines", (err, result) => {
      if (err) {
        console.error("DB error while generating filename:", err);
        return cb(err);
      }
      const nextId = (result[0].maxId || 0) + 1;
      const ext = path.extname(file.originalname);
      const fileName = `machine${nextId}${ext}`;
      cb(null, fileName);
    });
  },
});

const upload = multer({ storage });

// ✅ Get all machines
router.get("/", (req, res) => {
  const sql = "SELECT id, name, role, description, image FROM machines";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// ✅ Add new machine
router.post("/", upload.single("image"), (req, res) => {
  const { name, role, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO machines (name, role, description, image)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [name, role, description, imageUrl], (err, result) => {
    if (err) {
      console.error("Error inserting machine:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "Machine added", id: result.insertId });
  });
});

// ✅ Get machine by ID with logs + beacon
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
    if (machineResults.length === 0)
      return res.status(404).json({ error: "Machine not found" });

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

// -------------------------------------------------------
// 🔹 MQTT Integration (subscribe & save beacon data)
// -------------------------------------------------------
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Example fixed gateway coordinates in meters
const gatewayCoords = {
  gateway_A: { x: 0,   y: 0 },
  gateway_B: { x: 100, y: 0 },
  gateway_C: { x: 0,   y: 100 },
  gateway_D: { x: 100, y: 100 }
};

// Convert RSSI → distance
function rssiToDistance(rssi, txPower = -59, n = 2.5) {
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

// Weighted centroid method
function estimatePosition(gatewayReadings, txPower = -59, n = 2.5) {
  let x = 0, y = 0, totalWeight = 0;

  for (const r of gatewayReadings) {
    const dist = rssiToDistance(r.rssi, txPower, n);
    const weight = 1 / dist;
    x += r.x * weight;
    y += r.y * weight;
    totalWeight += weight;
  }

  return { x: x / totalWeight, y: y / totalWeight };
}

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ public broker");
  client.subscribe("beacons/data", (err) => {
    if (!err) {
      console.log("📡 Subscribed to beacons/data");
    } else {
      console.error("❌ Subscription error:", err);
    }
  });
});

client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 Beacon MQTT data:", data);

    const sql = `
      INSERT INTO machine_beacon_data 
      (machine_id, deviceId, gatewayId, timestamp, accel_x, accel_y, accel_z,
       rssi, txPower, batteryLevel, status, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      data.machine_id,
      data.deviceId,
      data.gatewayId,   // ✅ added gatewayId
      data.timestamp,
      data.accel_x,
      data.accel_y,
      data.accel_z,
      data.rssi,
      data.txPower,
      data.batteryLevel,
      data.status,
      data.latitude,
      data.longitude
    ], (err) => {
      if (err) {
        console.error("❌ DB Insert Error (beacon):", err);
      } else {
        console.log("✅ Beacon data saved to DB");

        // 🔹 After saving, try triangulation
        const query = `
          SELECT gatewayId, rssi, txPower 
          FROM machine_beacon_data 
          WHERE deviceId = ? 
          ORDER BY timestamp DESC 
          LIMIT 4;
        `;

        db.query(query, [data.deviceId], (err2, results) => {
          if (err2) return console.error("❌ Triangulation DB error:", err2);

          if (results.length >= 3) {
            const readings = results.map(r => {
              const g = gatewayCoords[r.gatewayId];
              return { x: g.x, y: g.y, rssi: r.rssi, txPower: r.txPower };
            });

            const { x, y } = estimatePosition(readings);
            console.log(`📍 Estimated Location of ${data.deviceId}: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
          } else {
            console.log("⚠️ Not enough gateways for triangulation");
          }
        });
      }
    });

  } catch (err) {
    console.error("❌ MQTT JSON Parse Error:", err.message);
  }
});




