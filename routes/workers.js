// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const multer = require("multer");
// const path = require("path");

// // Setup file upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Ensure "uploads" folder exists
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // Get all workers
// router.get("/", (req, res) => {
//   const sql = "SELECT id, name, role, description, image_url FROM workers";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     res.json(results);
//   });
// });

// // Get worker by ID with logs
// router.get("/:id", (req, res) => {
//   const workerId = req.params.id;

//   const workerSql = "SELECT * FROM workers WHERE id = ?";
//   const logsSql =
//     "SELECT work_date, hours_worked FROM work_logs WHERE worker_id = ? ORDER BY work_date";

//   db.query(workerSql, [workerId], (err, workerResults) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     if (workerResults.length === 0)
//       return res.status(404).json({ error: "Worker not found" });

//     db.query(logsSql, [workerId], (err2, logResults) => {
//       if (err2) return res.status(500).json({ error: "Database error" });

//       res.json({
//         worker: workerResults[0],
//         logs: logResults,
//       });
//     });
//   });
// });

// // Add a new worker
// router.post("/", upload.single("image"), (req, res) => {
//   const {
//     name,
//     role,
//     description,
//     phone,
//     gender,
//     age,
//     blood_group,
//     date_of_join,
//   } = req.body;

//   const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

//   const sql = `
//     INSERT INTO workers 
//     (name, role, description, phone, gender, age, blood_group, date_of_join, image_url)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(
//     sql,
//     [
//       name,
//       role,
//       description,
//       phone,
//       gender,
//       age,
//       blood_group,
//       date_of_join,
//       imageUrl,
//     ],
//     (err, result) => {
//       if (err) {
//         console.error("Error inserting worker:", err);
//         return res.status(500).json({ error: "Database error" });
//       }
//       res.json({ message: "Worker added successfully", workerId: result.insertId });
//     }
//   );
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
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Custom storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: async (req, file, cb) => {
    try {
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
    } catch (error) {
      cb(error);
    }
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

// Get worker by ID with optional date filter
router.get("/:id", (req, res) => {
  const workerId = req.params.id;
  const date = req.query.date; // optional query param YYYY-MM-DD

  const workerSql = "SELECT * FROM workers WHERE id = ?";
  const logsBaseSql = "SELECT work_date, hours_worked FROM work_logs WHERE worker_id = ?";
  const logsSql = date
    ? logsBaseSql + " AND work_date = ? ORDER BY work_date"
    : logsBaseSql + " ORDER BY work_date";

  db.query(workerSql, [workerId], (err, workerResults) => {
    if (err) return res.status(500).json({ error: "Database error in worker query" });
    if (workerResults.length === 0)
      return res.status(404).json({ error: "Worker not found" });

    const params = date ? [workerId, date] : [workerId];
    db.query(logsSql, params, (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error in logs query" });
      res.json({
            worker: workerResults[0],
            logs: logResults,
          });
      // Get latest latitude and longitude for this workerId
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
    device_id
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

module.exports = router;

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
function estimatePosition(gatewayReadings, txPower = -59, n = 2.5) {
  let lat = 0,
    lon = 0,
    totalWeight = 0;
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
    const rssi = data.rssi;
    const txPower = data.txPower;

    let workerId = null;
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

      workerId = results[0].worker_id;

      // Run triangulation using the current data
      runTriangulation(rssi, txPower, (lat, lon) => {
        if (!lat || !lon) {
          console.log("⚠️ Skipping location update (invalid triangulation result)");
          return;
        }

        // Update worker table with the latest lat/lon
        const updateWorkerSql = `
          UPDATE workers
          SET latitude = ?, longitude = ?
          WHERE id = ?
        `;
        db.query(updateWorkerSql, [lat, lon, workerId], (err) => {
          if (err) {
            console.error("❌ Worker location update error:", err);
          } else {
            console.log(`✅ Worker ${workerId} location updated`);
          }
        });

        // Check if today's log exists
        const checkLogSql = `
          SELECT id FROM work_logs
          WHERE worker_id = ? AND work_date = CURDATE()
          LIMIT 1
        `;
        db.query(checkLogSql, [workerId], (err2, logResults) => {
          if (err2) {
            console.error("❌ Work log check error:", err2);
            return;
          }

          if (logResults.length === 0) {
            // Insert new log row for today
            const insertLogSql = `
              INSERT INTO work_logs (worker_id, work_date, hours_worked)
              VALUES (?, CURDATE(), 0)
            `;
            db.query(insertLogSql, [workerId], (err3) => {
              if (err3) {
                console.error("❌ Insert work log error:", err3);
              } else {
                console.log(`🆕 Work log created for worker ${workerId} today`);
              }
            });
          } else {
            console.log(`ℹ️ Work log already exists for worker ${workerId} today`);
          }
        });
      });
    });
  } catch (err) {
    console.error("❌ MQTT JSON Parse Error:", err.message);
  }
});

// ----------------- TRIANGULATION ----------------- //
function runTriangulation(rssi, txPower, callback) {
  try {
    // Use the fixed gateway coordinates for triangulation
    const gatewayReadings = Object.keys(gatewayCoords).map((gatewayId) => {
      const gateway = gatewayCoords[gatewayId];
      return { lat: gateway.lat, lon: gateway.lon, rssi, txPower };
    });

    const { latitude, longitude } = estimatePosition(gatewayReadings);
    callback(latitude, longitude);
  } catch (err) {
    console.error("❌ Triangulation error:", err);
    callback(null, null);
  }
}

