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
const mqtt = require("mqtt");

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

// ----------------- EXPRESS ROUTES ----------------- //

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
  const { name, role, description, deviceId } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = "INSERT INTO machines (name, role, description, image) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, role, description, imageUrl], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    const machineId = result.insertId;
    if (deviceId) {
      const mapSql = "INSERT INTO beacon_machine_map (beacon_id, machine_id) VALUES (?, ?)";
      db.query(mapSql, [deviceId, machineId], (mapErr) => {
        if (mapErr) return res.status(500).json({ error: "Mapping error" });
        res.status(201).json({ message: "Machine added", id: machineId });
      });
    } else {
      res.status(201).json({ message: "Machine added", id: machineId });
    }
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
    ORDER BY log_date
  `;
  const beaconSql = `
    SELECT id, machine_id, deviceId, timestamp, accel_x, accel_y, accel_z,
           rssi, txPower, batteryLevel, status, latitude, longitude
    FROM machine_beacon_data
    WHERE machine_id = ?
    ORDER BY timestamp DESC LIMIT 1
  `;

  db.query(machineSql, [machineId], (err, machineResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!machineResults.length) return res.status(404).json({ error: "Machine not found" });

    db.query(logsSql, [machineId], (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(beaconSql, [machineId], (err3, beaconResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        const beacon = beaconResults.length ? beaconResults[0] : null;
        if (beacon) {
          beacon.latitude = beacon.latitude !== null ? parseFloat(beacon.latitude) : 0;
          beacon.longitude = beacon.longitude !== null ? parseFloat(beacon.longitude) : 0;
        }

        res.json({
          machine: machineResults[0],
          logs: logResults || [],
          beacon,
        });
      });
    });
  });
});

module.exports = router;

// ----------------- MQTT INTEGRATION ----------------- //

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ public broker");
  client.subscribe(["beacons/data", "trucks/gps"], (err) => {
    if (err) console.error("❌ Subscription error:", err);
    else console.log("📡 Subscribed to beacons/data and trucks/gps");
  });
});

// Fixed gateway coordinates
const gatewayCoords = {
  "Gateway-A": { lat: 15.585108, lon: 79.825956 },
  "Gateway-B": { lat: 15.585979, lon: 79.826868 },
  "Gateway-C": { lat: 15.585958, lon: 79.825935 },
  "Gateway-D": { lat: 15.586149, lon: 79.826879 },
};

// RSSI → distance
function rssiToDistance(rssi, txPower = -59, n = 2.5) {
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

// Weighted centroid method
function estimatePosition(gatewayReadings) {
  let lat = 0,
    lon = 0,
    totalWeight = 0;
  for (const r of gatewayReadings) {
    const dist = rssiToDistance(r.rssi, r.txPower || -59);
    const weight = 1 / dist;
    lat += r.lat * weight;
    lon += r.lon * weight;
    totalWeight += weight;
  }
  return totalWeight > 0
    ? { latitude: lat / totalWeight, longitude: lon / totalWeight }
    : { latitude: 0, longitude: 0 };
}

// Handle incoming MQTT messages
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`📥 MQTT data [${topic}]:`, data);

    if (topic === "beacons/data") handleBeaconData(data);
    else if (topic === "trucks/gps") handleTruckData(data);
  } catch (err) {
    console.error("❌ MQTT JSON Parse Error:", err.message);
  }
});

// ----------------- BEACON HANDLER ----------------- //
function handleBeaconData(data) {
  const checkSql = `SELECT id FROM machine_beacon_data WHERE deviceId = ? LIMIT 1`;
  db.query(checkSql, [data.deviceId], (err, results) => {
    if (err) return console.error("❌ DB Check Error:", err);

    const saveRow = (id = null, lat = data.latitude ?? null, lon = data.longitude ?? null) => {
      // Get machine_id from beacon_machine_map using deviceId
      const getMachineIdSql = `SELECT machine_id FROM beacon_machine_map WHERE beacon_id = ? LIMIT 1`;
      db.query(getMachineIdSql, [data.deviceId], (errMap, mapResults) => {
        if (errMap) return console.error("❌ DB beacon_machine_map Error:", errMap);

        const machine_id = mapResults.length ? mapResults[0].machine_id : null;

        if (id) {
          const updateSql = `
        UPDATE machine_beacon_data
        SET gatewayId=?, accel_x=?, accel_y=?, accel_z=?,
            rssi=?, txPower=?, batteryLevel=?, status=?,
            latitude=?, longitude=?, timestamp=?, machine_id=?
        WHERE id=?
          `;
          db.query(updateSql, [
        data.gatewayId || null,
        data.accelerometer?.x ?? null,
        data.accelerometer?.y ?? null,
        data.accelerometer?.z ?? null,
        data.rssi ?? null,
        data.txPower ?? null,
        data.batteryLevel ?? null,
        data.status || null,
        lat,
        lon,
        data.timestamp || new Date(),
        machine_id,
        id,
          ], (err2) => {
        if (err2) console.error("❌ DB Update Error:", err2);
        else console.log("✅ Beacon data updated:", data.deviceId);
          });
        } else {
          const insertSql = `
        INSERT INTO machine_beacon_data
        (machine_id, deviceId, gatewayId, timestamp, accel_x, accel_y, accel_z,
         rssi, txPower, batteryLevel, status, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(insertSql, [
        machine_id,
        data.deviceId || null,
        data.gatewayId || null,
        data.timestamp || new Date(),
        data.accelerometer?.x ?? null,
        data.accelerometer?.y ?? null,
        data.accelerometer?.z ?? null,
        data.rssi ?? null,
        data.txPower ?? null,
        data.batteryLevel ?? null,
        data.status || null,
        lat,
        lon,
          ], (err2) => {
        if (err2) console.error("❌ DB Insert Error:", err2);
        else console.log("✅ Beacon data inserted:", data.deviceId);
          });
        }
      });
    };

    runTriangulation(data.deviceId, (lat, lon) => {
      if (results.length > 0) saveRow(results[0].id, lat, lon);
      else saveRow(null, lat, lon);
    });
  });
}

// ----------------- TRUCK HANDLER ----------------- //
function handleTruckData(data) {
  const insertSql = `
    INSERT INTO truck_tracker_data
    (truck_id, latitude, longitude, speed, fuel_level, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(insertSql, [
    data.truck_id,
    data.latitude ?? null,
    data.longitude ?? null,
    data.speed ?? null,
    data.fuel_level ?? null,
    data.timestamp || new Date(),
  ], (err) => {
    if (err) console.error("❌ Truck Insert Error:", err);
    else console.log("✅ Truck data inserted:", data.truck_id);
  });
}

// ----------------- TRIANGULATION ----------------- //
function runTriangulation(deviceId, callback) {
  const query = `
    SELECT gatewayId, rssi, txPower
    FROM machine_beacon_data
    WHERE deviceId = ?
    ORDER BY timestamp DESC
    LIMIT 4
  `;
  db.query(query, [deviceId], (err, results) => {
    if (err) return console.error("❌ Triangulation DB error:", err);

    if (results.length >= 1) {
      const readings = results.map((r) => {
        const g = gatewayCoords[r.gatewayId];
        return { lat: g.lat, lon: g.lon, rssi: r.rssi, txPower: r.txPower };
      });
      const { latitude, longitude } = estimatePosition(readings);
      callback(latitude, longitude);
    } else {
      console.log("⚠️ Not enough gateways for triangulation");
      callback(null, null);
    }
  });
}












