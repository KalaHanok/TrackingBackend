// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");

// // Get all trucks
// router.get("/", (req, res) => {
//   const sql = "SELECT id, name, role, description, image_url FROM trucks";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     res.json(results);
//   });
// });

// // Get truck by ID with logs + tracker data + latest location
// router.get("/:id", (req, res) => {
//   const truckId = req.params.id;
//   const { date } = req.query; // YYYY-MM-DD from frontend

//   const truckSql = "SELECT * FROM trucks WHERE id = ?";

//   // Logs query (history, optionally filter by date)
//   let logsSql = `
//     SELECT 
//       id,
//       truck_id,
//       current_location,
//       hours_worked,
//       fuel_consumption,
//       state,
//       weight,
//       distance_travelled,
//       log_time
//     FROM truck_logs
//     WHERE truck_id = ?
//   `;
//   const logParams = [truckId];
//   if (date) {
//     logsSql += " AND DATE(log_time) = ?";
//     logParams.push(date);
//   }
//   logsSql += " ORDER BY log_time;";

//   // Tracker query (latest tracker data, optionally filter by date)
//   let trackerSql = `
//     SELECT 
//       id,
//       truck_id,
//       device_id,
//       timestamp,
//       latitude,
//       longitude,
//       altitude,
//       speed_kmph,
//       heading_degrees,
//       ignition,
//       battery_level,
//       signal_strength,
//       gps_fix,
//       event_type,
//       event_description,
//       geofence_alert
//     FROM truck_tracker_data
//     WHERE truck_id = ?
//   `;
//   const trackerParams = [truckId];
//   if (date) {
//     trackerSql += " AND DATE(timestamp) = ?";
//     trackerParams.push(date);
//   }
//   trackerSql += " ORDER BY timestamp DESC LIMIT 1;";

//   // Latest location query (separate from logs, always available)
//   let latestLocationSql = `
//     SELECT current_location, log_time
//     FROM truck_logs
//     WHERE truck_id = ?
//   `;
//   const latestLocParams = [truckId];
//   if (date) {
//     latestLocationSql += " AND DATE(log_time) = ?";
//     latestLocParams.push(date);
//   }
//   latestLocationSql += " ORDER BY log_time DESC LIMIT 1;";

//   // Run queries
//   db.query(truckSql, [truckId], (err, truckResults) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     if (truckResults.length === 0) {
//       return res.status(404).json({ error: "Truck not found" });
//     }

//     db.query(logsSql, logParams, (err2, logResults) => {
//       if (err2) return res.status(500).json({ error: "Database error" });

//       db.query(trackerSql, trackerParams, (err3, trackerResults) => {
//         if (err3) return res.status(500).json({ error: "Database error" });

//         db.query(latestLocationSql, latestLocParams, (err4, locationResults) => {
//           if (err4) return res.status(500).json({ error: "Database error" });

//           res.json({
//             truck: truckResults[0],
//             logs: logResults, // full logs (possibly filtered by date)
//             tracker: trackerResults.length ? trackerResults[0] : null, // latest tracker data
//             location: locationResults.length ? locationResults[0] : null // latest location
//           });
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
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    db.query("SELECT MAX(id) AS maxId FROM trucks", (err, result) => {
      if (err) {
        console.error("DB error while generating filename:", err);
        return cb(err);
      }
      const nextId = (result[0].maxId || 0) + 1;
      const ext = path.extname(file.originalname);
      const fileName = `truck${nextId}${ext}`;
      cb(null, fileName);
    });
  },
});

const upload = multer({ storage });

// ========================== ROUTES ========================== //

// Get all trucks
router.get("/", (req, res) => {
  const sql = "SELECT id, name, role, description, image_url FROM trucks";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// Get truck by ID with logs + tracker data + latest location
router.get("/:id", (req, res) => {
  const truckId = req.params.id;
  const { date } = req.query;

  const truckSql = "SELECT * FROM trucks WHERE id = ?";

  let logsSql = `
    SELECT id, truck_id, current_location, hours_worked, fuel_consumption,
           state, weight, distance_travelled, log_time
    FROM truck_logs
    WHERE truck_id = ?
  `;
  const logParams = [truckId];
  if (date) {
    logsSql += " AND DATE(log_time) = ?";
    logParams.push(date);
  } else {
    logsSql += " AND DATE(log_time) = CURDATE()";
  }
  logsSql += " ORDER BY log_time;";

  let trackerSql = `
    SELECT id, truck_id, device_id, timestamp, latitude, longitude, altitude,
           speed_kmph, heading_degrees, ignition, battery_level, signal_strength,
           gps_fix, event_type, event_description, geofence_alert
    FROM truck_tracker_data
    WHERE truck_id = ?
  `;
  const trackerParams = [truckId];
  if (date) {
    trackerSql += " AND DATE(timestamp) = ?";
    trackerParams.push(date);
  } else {
    trackerSql += " AND DATE(timestamp) = CURDATE()";
  }
  trackerSql += " ORDER BY timestamp DESC;";

  let latestLocationSql = `
    SELECT current_location, log_time
    FROM truck_logs
    WHERE truck_id = ?
  `;
  const latestLocParams = [truckId];
  if (date) {
    latestLocationSql += " AND DATE(log_time) = ?";
    latestLocParams.push(date);
  } else {
    latestLocationSql += " AND DATE(log_time) = CURDATE()";
  }
  latestLocationSql += " ORDER BY log_time DESC LIMIT 1;";

  db.query(truckSql, [truckId], (err, truckResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (truckResults.length === 0) {
      return res.status(404).json({ error: "Truck not found" });
    }

    db.query(logsSql, logParams, (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(trackerSql, trackerParams, (err3, trackerResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        db.query(latestLocationSql, latestLocParams, (err4, locationResults) => {
          if (err4) return res.status(500).json({ error: "Database error" });

          res.json({
            truck: truckResults[0],
            logs: logResults,
            tracker: trackerResults,
            location: locationResults.length ? locationResults[0] : null,
          });
        });
      });
    });
  });
});

// Add a new truck
router.post("/", upload.single("image"), (req, res) => {
  const { name, role, description } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO trucks (name, role, description, image_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, role, description, imageUrl], (err, result) => {
    if (err) {
      console.error("Error inserting truck:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Truck added successfully", truckId: result.insertId });
  });
});

module.exports = router;

// ========================== MQTT ========================== //

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  client.subscribe("gps/data", (err) => {
    if (err) console.error("Subscription error:", err);
  });
});

client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📩 MQTT message received:", data);

    const {
      truck_id,
      device_id,
      timestamp,
      latitude,
      longitude,
      altitude = null,
      speed_kmph = null,
      heading_degrees = null,
      ignition = null,
      battery_level = null,
      signal_strength = null,
      gps_fix = null,
      event_type = null,
      event_description = null,
      geofence_alert = null,
    } = data;

    // Insert into tracker table
    const trackerSql = `
      INSERT INTO truck_tracker_data
      (truck_id, device_id, timestamp, latitude, longitude, altitude,
       speed_kmph, heading_degrees, ignition, battery_level, signal_strength,
       gps_fix, event_type, event_description, geofence_alert)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      trackerSql,
      [
        truck_id,
        device_id,
        timestamp,
        latitude,
        longitude,
        altitude,
        speed_kmph,
        heading_degrees,
        ignition,
        battery_level,
        signal_strength,
        gps_fix,
        event_type,
        event_description,
        geofence_alert,
      ],
      (err) => {
        if (err) {
          console.error("❌ Error inserting tracker data:", err);
        } else {
          console.log("✅ Tracker data inserted");
        }
      }
    );

    // Update daily logs
    const today = new Date(timestamp).toISOString().split("T")[0];
    const checkSql = `
      SELECT * FROM truck_logs
      WHERE truck_id = ? AND DATE(log_time) = ?
      ORDER BY log_time DESC
      LIMIT 1
    `;
    db.query(checkSql, [truck_id, today], (err, results) => {
      if (err) return console.error("DB error:", err);

      if (results.length) {
        const log = results[0];
        const diffMs = new Date(timestamp) - new Date(log.log_time);
        const diffHours = diffMs / (1000 * 60 * 60);
        const newHoursWorked = log.hours_worked + (ignition ? diffHours : 0);

        const [prevLat, prevLon] = log.current_location.split(",").map(Number);
        const R = 6371;
        const dLat = (latitude - prevLat) * Math.PI / 180;
        const dLon = (longitude - prevLon) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(prevLat * Math.PI / 180) *
          Math.cos(latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        const newDistance = log.distance_travelled + (ignition ? distance : 0);

        const updateSql = `
          UPDATE truck_logs
          SET hours_worked = ?, distance_travelled = ?, current_location = ?, log_time = ?
          WHERE id = ?
        `;
        db.query(updateSql, [newHoursWorked, newDistance, `${latitude},${longitude}`, timestamp, log.id], (err2) => {
          if (err2) console.error("Error updating truck_logs:", err2);
          else console.log("✅ truck_logs updated");
        });
      } else {
        const insertSql = `
          INSERT INTO truck_logs
          (truck_id, current_location, hours_worked, distance_travelled, log_time)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.query(insertSql, [truck_id, `${latitude},${longitude}`, 0, 0, timestamp], (err3) => {
          if (err3) console.error("Error inserting truck_logs:", err3);
          else console.log("✅ New truck_logs row created");
        });
      }
    });
  } catch (error) {
    console.error("❌ Error processing MQTT message:", error);
  }
});







