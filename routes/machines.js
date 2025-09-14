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

// Get machine by ID with logs + latest beacon + latest location
router.get("/:id", (req, res) => {
  const machineId = req.params.id;

  const machineSql = "SELECT * FROM machines WHERE id = ?";
  const logsSql = `
    SELECT id, machine_id, current_location, hours_worked, fuel_consumption,
           material_processed, state, log_date
    FROM machine_logs
    WHERE machine_id = ?
    ORDER BY log_date
  `;
  const beaconSql = `
    SELECT id, machine_id, deviceId, timestamp, accel_x, accel_y, accel_z,
           rssi, txPower, batteryLevel, status
    FROM machine_beacon_data
    WHERE machine_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `;
  const locationSql = `
    SELECT latitude, longitude
    FROM machine_location
    WHERE machine_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(machineSql, [machineId], (err, machineResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!machineResults.length) return res.status(404).json({ error: "Machine not found" });

    db.query(logsSql, [machineId], (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(beaconSql, [machineId], (err3, beaconResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        db.query(locationSql, [machineId], (err4, locationResults) => {
          if (err4) return res.status(500).json({ error: "Database error" });

          const beacon = beaconResults.length ? beaconResults[0] : null;
          const location = locationResults.length
            ? {
              latitude: parseFloat(locationResults[0].latitude),
              longitude: parseFloat(locationResults[0].longitude),
            }
            : { latitude: 0, longitude: 0 };

          res.json({
            machine: machineResults[0],
            logs: logResults || [],
            beacon,
            location,
          });
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
  client.subscribe(["beacons/data"], (err) => {
    if (err) console.error("❌ Subscription error:", err);
    else console.log("📡 Subscribed to beacons/data");
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
function rssiToDistance(rssi, txPower, n = 2.5) {
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
  const insertBeaconSql = `
    INSERT INTO machine_beacon_data
    (machine_id, deviceId, gatewayId, timestamp, accel_x, accel_y, accel_z,
     rssi, txPower, batteryLevel, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Get machine_id from beacon_machine_map using deviceId
  const getMachineIdSql = `SELECT machine_id FROM beacon_machine_map WHERE beacon_id = ? LIMIT 1`;
  db.query(getMachineIdSql, [data.deviceId], (errMap, mapResults) => {
    if (errMap) return console.error("❌ DB beacon_machine_map Error:", errMap);

    const machine_id = mapResults.length ? mapResults[0].machine_id : null;

    if (!machine_id) {
      console.log(`⚠️ No machine mapping found for deviceId ${data.deviceId}`);
      return;
    }

    // Insert the beacon data into machine_beacon_data
    db.query(
      insertBeaconSql,
      [
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
      ],
      (errInsert) => {
        if (errInsert) {
          console.error("❌ DB Insert Error (machine_beacon_data):", errInsert);
        } else {
          console.log("✅ Beacon data inserted:", data.deviceId);

          // After inserting the beacon data, calculate latitude and longitude
          calculateAndStoreLocation(data.deviceId, machine_id);
        }
      }
    );
  });
}

// ----------------- CALCULATE AND STORE LOCATION ----------------- //
function calculateAndStoreLocation(deviceId, machineId) {
  // Corrected SQL query to retrieve the latest data for each gatewayId
  const queryGateways = `
    SELECT m.* 
    FROM machine_beacon_data m 
    JOIN (
      SELECT gatewayId, MAX(timestamp) AS max_ts 
      FROM machine_beacon_data 
      WHERE deviceId = ? 
      GROUP BY gatewayId
    ) t 
    ON m.gatewayId = t.gatewayId AND m.timestamp = t.max_ts 
    WHERE m.deviceId = ?
  `;

  db.query(queryGateways, [deviceId, deviceId], (err, results) => {
    if (err) {
      console.error("❌ DB Query Error (retrieve gateways):", err);
      return;
    }

    if (results.length < 3) {
      console.log("⚠️ Not enough gateways for triangulation (minimum 3 required)");
      return;
    }

    // Prepare gateway readings for triangulation
    const gatewayReadings = results.map((r) => {
      const gateway = gatewayCoords[r.gatewayId];
      return { lat: gateway.lat, lon: gateway.lon, rssi: r.rssi, txPower: r.txPower };
    });

    // Calculate latitude and longitude using triangulation
    const { latitude, longitude } = estimatePosition(gatewayReadings);

    // Insert the calculated location into machine_location
    const insertLocationSql = `
      INSERT INTO machine_location (machine_id, latitude, longitude)
      VALUES (?, ?, ?)
    `;
    db.query(insertLocationSql, [machineId, latitude, longitude], (errInsert) => {
      if (errInsert) {
        console.error("❌ DB Insert Error (machine_location):", errInsert);
      } else {
        console.log(`✅ Location stored for machine ${machineId}: (${latitude}, ${longitude})`);
      }
    });
  });
}













