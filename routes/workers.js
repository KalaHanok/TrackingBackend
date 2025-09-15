const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mqtt = require("mqtt");

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
    db.query("SELECT MAX(id) AS maxId FROM workers", (err, result) => {
      if (err) {
        console.error("DB error while generating filename:", err);
        return cb(err);
      }
      const nextId = (result[0].maxId || 0) + 1;
      const ext = path.extname(file.originalname);
      const fileName = `worker${nextId}${ext}`;
      cb(null, fileName);
    });
  },
});

const upload = multer({ storage });

// ----------------- ROUTES ------------------

// Get all workers
router.get("/", (req, res) => {
  const sql = "SELECT id, name, role, description, image_url FROM workers";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// Get worker by ID with logs, days worked in this month, and hours worked today
router.get("/:id", (req, res) => {
  const workerId = req.params.id;

  const workerSql = "SELECT * FROM workers WHERE id = ?";
  const logsSql = `
    SELECT COUNT(DISTINCT work_date) AS days_worked
    FROM work_logs
    WHERE worker_id = ? 
      AND work_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE()
  `;
  const hoursTodaySql = `
    SELECT SUM(hours_worked) AS hours_worked_today
    FROM work_logs
    WHERE worker_id = ? AND work_date = CURDATE()
  `;
  const locationSql = `
    SELECT latitude, longitude 
    FROM worker_location 
    WHERE worker_id = ? 
    ORDER BY id DESC 
    LIMIT 1
  `;

  db.query(workerSql, [workerId], (err, workerResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (workerResults.length === 0)
      return res.status(404).json({ error: "Worker not found" });

    db.query(logsSql, [workerId], (err2, logsResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(hoursTodaySql, [workerId], (err3, hoursResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        db.query(locationSql, [workerId], (err4, locationResults) => {
          if (err4) return res.status(500).json({ error: "Database error" });

          const location = locationResults.length
            ? {
                latitude: parseFloat(locationResults[0].latitude),
                longitude: parseFloat(locationResults[0].longitude),
              }
            : { latitude: 0, longitude: 0 };

          res.json({
            worker: workerResults[0],
            location,
            logs: {
              days_worked: logsResults[0]?.days_worked || 0,
              hours_worked_today: hoursResults[0]?.hours_worked_today || 0
            }
          });
        });
      });
    });
  });
});

// Add a new worker
router.post("/", upload.single("image"), (req, res) => {
  const {
    name,
    role,
    description,
    phone,
    gender,
    age,
    blood_group,
    date_of_join,
    device_id,
  } = req.body;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO workers 
    (name, role, description, phone, gender, age, blood_group, date_of_join, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      role,
      description,
      phone,
      gender,
      age,
      blood_group,
      date_of_join,
      imageUrl,
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting worker:", err);
        return res.status(500).json({ error: "Database error" });
      }
      const workerId = result.insertId;
      // Insert into worker_device_mapping
      const mappingSql = `
        INSERT INTO worker_device_mapping (worker_id, deviceId)
        VALUES (?, ?)
      `;
      db.query(mappingSql, [workerId, device_id], (err2) => {
        if (err2) {
          console.error("Error inserting worker_device_mapping:", err2);
          return res.status(500).json({ error: "Database error (mapping)" });
        }
        res.json({ message: "Worker added successfully", workerId });
      });
    }
  );
});

// ==================== MQTT INTEGRATION ==================== //

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

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

// MQTT connect & subscribe
client.on("connect", () => {
  console.log("✅ Connected to HiveMQ public broker (workers)");
  client.subscribe("beacons/data", (err) => {
    if (err) console.error("❌ Subscription error:", err);
    else console.log("📡 Subscribed to beacons/data");
  });
});

// Handle incoming MQTT messages for workers
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 Worker Beacon MQTT data:", data);

    const deviceId = data.deviceId;

    // Get worker_id from worker_device_mapping
    const workerMappingSql = `
      SELECT worker_id FROM worker_device_mapping WHERE deviceId = ?
    `;
    db.query(workerMappingSql, [deviceId], (err, results) => {
      if (err) {
        console.error("❌ Worker mapping query error:", err);
        return;
      }

      if (results.length === 0) {
        console.log(`⚠️ No worker mapping found for deviceId ${deviceId}`);
        return;
      }

      const workerId = results[0].worker_id;

      // Insert the beacon data into worker_beacon_data
      const insertBeaconSql = `
        INSERT INTO worker_beacon_data
        (deviceId, gatewayId, timestamp, accel_x, accel_y, accel_z,
         rssi, txPower, batteryLevel, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertBeaconSql,
        [
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
            console.error("❌ DB Insert Error (worker_beacon_data):", errInsert);
          } else {
            console.log("✅ Beacon data inserted:", data.deviceId);

            // After inserting the beacon data, calculate latitude and longitude
            calculateAndStoreWorkerLocation(data.deviceId, workerId);
          }
        }
      );
    });
  } catch (err) {
    console.error("❌ MQTT JSON Parse Error:", err.message);
  }
});

// ----------------- CALCULATE AND STORE LOCATION ----------------- //
function calculateAndStoreWorkerLocation(deviceId, workerId) {
  const queryGateways = `
    SELECT w.* 
    FROM worker_beacon_data w 
    JOIN (
      SELECT gatewayId, MAX(timestamp) AS max_ts 
      FROM worker_beacon_data 
      WHERE deviceId = ? 
      GROUP BY gatewayId
    ) t 
    ON w.gatewayId = t.gatewayId AND w.timestamp = t.max_ts 
    WHERE w.deviceId = ?
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

    // Insert the calculated location into worker_location
    const insertLocationSql = `
      INSERT INTO worker_location (worker_id, latitude, longitude)
      VALUES (?, ?, ?)
    `;
    db.query(insertLocationSql, [workerId, latitude, longitude], (errInsert) => {
      if (errInsert) {
        console.error("❌ DB Insert Error (worker_location):", errInsert);
      } else {
        console.log(`✅ Location stored for worker ${workerId}: (${latitude}, ${longitude})`);
      }
    });
  });
}

module.exports = router;

