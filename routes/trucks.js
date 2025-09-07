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
    // Get the next truck ID from DB
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

  const truckSql = "SELECT * FROM trucks WHERE id = ?";

  const logsSql = `
    SELECT id, truck_id, current_location, hours_worked, fuel_consumption,
           state, weight, distance_travelled, log_time
    FROM truck_logs
    WHERE truck_id = ?
    ORDER BY log_time;
  `;

  const trackerSql = `
    SELECT id, truck_id, device_id, timestamp, latitude, longitude, altitude,
           speed_kmph, heading_degrees, ignition, battery_level, signal_strength,
           gps_fix, event_type, event_description, geofence_alert
    FROM truck_tracker_data
    WHERE truck_id = ?
    ORDER BY timestamp DESC;
  `;

  const latestLocationSql = `
    SELECT current_location, log_time
    FROM truck_logs
    WHERE truck_id = ?
    ORDER BY log_time DESC
    LIMIT 1;
  `;

  db.query(truckSql, [truckId], (err, truckResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!truckResults.length) return res.status(404).json({ error: "Truck not found" });

    db.query(logsSql, [truckId], (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(trackerSql, [truckId], (err3, trackerResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        // Ensure tracker lat/lng are numbers
        const safeTracker = trackerResults.map((t) => ({
          ...t,
          latitude: t.latitude !== null ? parseFloat(t.latitude) : 0,
          longitude: t.longitude !== null ? parseFloat(t.longitude) : 0,
        }));

        db.query(latestLocationSql, [truckId], (err4, locationResults) => {
          if (err4) return res.status(500).json({ error: "Database error" });

          // Ensure latest location is safe
          let safeLocation = null;
          if (locationResults.length && locationResults[0].current_location) {
            const [latStr, lonStr] = locationResults[0].current_location.split(",");
            safeLocation = {
              latitude: parseFloat(latStr) || 0,
              longitude: parseFloat(lonStr) || 0,
              ...locationResults[0],
            };
          }

          res.json({
            truck: truckResults[0],
            logs: logResults,
            tracker: safeTracker,
            location: safeLocation,
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

// Connect to MQTT broker
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

    const { device_id, timestamp, location, status, event } = data;

    // 🔹 Get truck_id from mapping table
    const getTruckIdSql = "SELECT truck_id FROM truck_devices WHERE device_id = ?";
    db.query(getTruckIdSql, [device_id], (err, result) => {
      if (err) return console.error("❌ Error fetching truck_id:", err);
      if (!result.length) {
        return console.warn(`⚠️ No truck mapped for device_id ${device_id}`);
      }

      const truck_id = result[0].truck_id;

      // ================= Insert tracker data =================
      const trackerSql = `
        INSERT INTO truck_tracker_data
        (truck_id, device_id, timestamp, latitude, longitude, altitude,
         speed_kmph, heading_degrees, ignition, battery_level, signal_strength,
         gps_fix, event_type, event_description, geofence_alert)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        trackerSql,
        [
          truck_id,
          device_id,
          timestamp,
          location.latitude,
          location.longitude,
          location.altitude,
          location.speed_kmph,
          location.heading_degrees,
          status.ignition,
          status.battery_level,
          status.signal_strength,
          status.gps_fix,
          event.type,
          event.description,
          event.geofence_alert,
        ],
        (err2) => {
          if (err2) console.error("❌ Error inserting tracker data:", err2);
        }
      );

      // ================= Insert/Update logs =================
      const today = new Date(timestamp).toISOString().split("T")[0];

      const checkSql = `
        SELECT * FROM truck_logs
        WHERE truck_id = ? AND DATE(log_time) = ?
        ORDER BY log_time DESC
        LIMIT 1
      `;

      db.query(checkSql, [truck_id, today], (err3, results) => {
        if (err3) return console.error("❌ DB error:", err3);

        if (results.length) {
          const log = results[0];

          // Hours worked
          const diffMs = new Date(timestamp) - new Date(log.log_time);
          const diffHours = diffMs / (1000 * 60 * 60);
          const newHoursWorked = log.hours_worked + (status.ignition ? diffHours : 0);

          // Distance travelled (Haversine)
          const [prevLat, prevLon] = log.current_location.split(",").map(Number);
          const R = 6371;
          const dLat = (location.latitude - prevLat) * Math.PI / 180;
          const dLon = (location.longitude - prevLon) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(prevLat * Math.PI / 180) *
              Math.cos(location.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          const newDistance = log.distance_travelled + (status.ignition ? distance : 0);

          const updateSql = `
            UPDATE truck_logs
            SET hours_worked = ?, distance_travelled = ?, current_location = ?, log_time = ?
            WHERE id = ?
          `;
          db.query(
            updateSql,
            [newHoursWorked, newDistance, `${location.latitude},${location.longitude}`, timestamp, log.id],
            (err4) => {
              if (err4) console.error("❌ Error updating truck_logs:", err4);
            }
          );
        } else {
          const insertSql = `
            INSERT INTO truck_logs
            (truck_id, current_location, hours_worked, distance_travelled, log_time)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.query(
            insertSql,
            [truck_id, `${location.latitude},${location.longitude}`, 0, 0, timestamp],
            (err5) => {
              if (err5) console.error("❌ Error inserting truck_logs:", err5);
            }
          );
        }
      });
    });
  } catch (error) {
    console.error("❌ Error processing MQTT message:", error);
  }
});







