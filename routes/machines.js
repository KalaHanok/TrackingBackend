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
// router.get("/:id", (req, res) => {
//   const machineId = req.params.id;

//   const machineSql = "SELECT * FROM machines WHERE id = ?";
//   const logsSql = `
//     SELECT id, machine_id, current_location, hours_worked, fuel_consumption,
//            material_processed, state, log_date
//     FROM machine_logs
//     WHERE machine_id = ?
//     ORDER BY log_date
//   `;
//   const beaconSql = `
//     SELECT id, machine_id, deviceId, timestamp, accel_x, accel_y, accel_z,
//            rssi, txPower, batteryLevel, status
//     FROM machine_beacon_data
//     WHERE machine_id = ?
//     ORDER BY timestamp DESC
//     LIMIT 1
//   `;
//   const locationSql = `
//     SELECT latitude, longitude
//     FROM machine_location
//     WHERE machine_id = ?
//     ORDER BY id DESC
//     LIMIT 1
//   `;
//   const latestActivitySql = `
//     SELECT activity_status, start_time, end_time
//     FROM machine_activity
//     WHERE machine_id = ?
//     ORDER BY end_time DESC
//     LIMIT 1
//   `;

//   db.query(machineSql, [machineId], (err, machineResults) => {
//     if (err) return res.status(500).json({ error: "Database error" });
//     if (!machineResults.length) return res.status(404).json({ error: "Machine not found" });

//     db.query(logsSql, [machineId], (err2, logResults) => {
//       if (err2) return res.status(500).json({ error: "Database error" });

//       db.query(beaconSql, [machineId], (err3, beaconResults) => {
//         if (err3) return res.status(500).json({ error: "Database error" });

//         db.query(locationSql, [machineId], (err4, locationResults) => {
//           if (err4) return res.status(500).json({ error: "Database error" });

//           db.query(latestActivitySql, [machineId], (err5, activityResults) => {
//             if (err5) return res.status(500).json({ error: "Database error" });

//             const beacon = beaconResults.length ? beaconResults[0] : null;
//             const location = locationResults.length
//               ? {
//                 latitude: parseFloat(locationResults[0].latitude),
//                 longitude: parseFloat(locationResults[0].longitude),
//               }
//               : { latitude: 0, longitude: 0 };

//             const latestActivity = activityResults.length > 0
//               ? {
//                   status: activityResults[0].activity_status,
//                   start_time: activityResults[0].start_time,
//                   end_time: activityResults[0].end_time,
//                 }
//               : { status: "idle", start_time: null, end_time: null };

//             res.json({
//               machine: machineResults[0],
//               logs: logResults || [],
//               beacon,
//               location,
//               latest_activity: latestActivity,
//             });
//           });
//         });
//       });
//     });
//   });
// });
// Get machine by ID for a specific date
router.get("/:id", (req, res) => {
  const machineId = req.params.id;
  const requestedDate = req.query.date || new Date().toISOString().split("T")[0];

  const machineSql = "SELECT * FROM machines WHERE id = ?";

  // All logs for that date
  const logsSql = `
    SELECT id, machine_id, current_location, hours_worked, fuel_consumption,
           material_processed, state, log_date
    FROM machine_logs
    WHERE machine_id = ? AND DATE(log_date) = ?
    ORDER BY log_date DESC
  `;

  // Hours worked for requestedDate (already summed in machine_logs)
  const hoursForDateSql = `
    SELECT hours_worked
    FROM machine_logs
    WHERE machine_id = ? AND DATE(log_date) = ?
    ORDER BY log_date DESC
    LIMIT 1
  `;

  // Latest location for requestedDate
  const locationSql = `
    SELECT latitude, longitude
    FROM machine_location
    WHERE machine_id = ? AND DATE(created_at) = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  // Latest beacon data for requestedDate
  const beaconSql = `
    SELECT *
    FROM machine_beacon_data
    WHERE machine_id = ? AND DATE(timestamp) = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `;

  // Latest activity for requestedDate
  const latestActivitySql = `
    SELECT activity_status, start_time, end_time
    FROM machine_activity
    WHERE machine_id = ? AND DATE(end_time) = ?
    ORDER BY end_time DESC
    LIMIT 1
  `;

  db.query(machineSql, [machineId], (err, machineResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (machineResults.length === 0)
      return res.status(404).json({ error: "Machine not found" });

    db.query(logsSql, [machineId, requestedDate], (err2, logsResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      db.query(hoursForDateSql, [machineId, requestedDate], (err3, hoursResults) => {
        if (err3) return res.status(500).json({ error: "Database error" });

        db.query(locationSql, [machineId, requestedDate], (err4, locationResults) => {
          if (err4) return res.status(500).json({ error: "Database error" });

          db.query(beaconSql, [machineId, requestedDate], (err5, beaconResults) => {
            if (err5) return res.status(500).json({ error: "Database error" });

            db.query(latestActivitySql, [machineId, requestedDate], (err6, activityResults) => {
              if (err6) return res.status(500).json({ error: "Database error" });

              const location = locationResults.length
                ? {
                    latitude: parseFloat(locationResults[0].latitude),
                    longitude: parseFloat(locationResults[0].longitude),
                  }
                : { latitude: 0, longitude: 0 };

              const lastBeacon = beaconResults.length ? beaconResults[0] : null;

              const latestActivity = activityResults.length > 0
                ? {
                    status: activityResults[0].activity_status,
                    start_time: activityResults[0].start_time,
                    end_time: activityResults[0].end_time,
                  }
                : { status: "idle", start_time: null, end_time: null };

              res.json({
                machine: machineResults[0],
                requested_date: requestedDate,
                logs: logsResults || [],
                hours_worked: hoursResults[0]?.hours_worked || 0,
                location,
                last_record: lastBeacon,
                latest_activity: latestActivity,
              });
            });
          });
        });
      });
    });
  });
});




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
  // "Gateway-A1": { lat: 15.5869, lon: 79.8222694444 },
  // "Gateway-A2": { lat: 15.5863833333, lon: 79.825 },
  // 'Gateway-A6': {lat: 15.5862416667, lon: 79.8273194444 },
  // 'Gateway-A7': {lat: 15.5860916667, lon: 79.830075 },
  // 'Gateway-A5': {lat: 15.5846722222, lon: 79.8278944444 },
  // "Gateway-A4": { lat: 15.5841944444, lon: 79.825075 },
  // "Gateway-A3": { lat: 15.5853583333, lon: 79.8240361111 },

  "GW_G_ZONE_G": { lat: 15.58675, lon: 79.82731 },
  "GW_B_ZONE_B": { lat: 15.58625, lon: 79.82715 },
  'GW_E_ZONE_E': {lat: 15.58626, lon: 79.82732 },
  'GW_A_ENTRANCE': {lat: 15.58674, lon: 79.82786 },
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
  const queryGateways = `
    SELECT m.*
    FROM machine_beacon_data m
    JOIN (
      SELECT gatewayId, MAX(timestamp) AS max_ts
      FROM machine_beacon_data
      WHERE deviceId = ? AND machine_id = ?
      GROUP BY gatewayId
    ) t
      ON m.gatewayId = t.gatewayId
     AND m.timestamp = t.max_ts
    WHERE m.deviceId = ? AND m.machine_id = ?
  `;

  db.query(
    queryGateways,
    [deviceId, machineId, deviceId, machineId],
    (err, results) => {
      if (err) {
        console.error("❌ DB Query Error (retrieve gateways):", err);
        return;
      }

      console.log(`📡 Gateways found for machine ${machineId}:`, results.length);

      if (results.length < 3) {
        console.warn("⚠️ Not enough gateways for triangulation");
        return;
      }

      const gatewayReadings = results
        .filter(r => gatewayCoords[r.gatewayId])
        .map(r => ({
          lat: gatewayCoords[r.gatewayId].lat,
          lon: gatewayCoords[r.gatewayId].lon,
          rssi: r.rssi,
          txPower: r.txPower
        }));

      if (gatewayReadings.length < 3) {
        console.warn("⚠️ Missing gateway coordinates");
        return;
      }

      const { latitude, longitude } = estimatePosition(gatewayReadings);

      const insertLocationSql = `
        INSERT INTO machine_location (machine_id, latitude, longitude)
        VALUES (?, ?, ?)
      `;

      db.query(
        insertLocationSql,
        [machineId, latitude, longitude],
        errInsert => {
          if (errInsert) {
            console.error("❌ DB Insert Error (machine_location):", errInsert);
          } else {
            console.log(
              `✅ Location stored for machine ${machineId}:`,
              latitude,
              longitude
            );
          }
        }
      );
    }
  );
}



// ----------------- PROCESS 5-MINUTE INTERVALS ----------------- //
function processMachineActivity() {
  console.log("🔄 Starting 5-minute machine activity processing...");
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const now = new Date();

  console.log(`⏱️ Querying data between ${fiveMinutesAgo} and ${now}`);

  const query = `
    SELECT machine_id, accel_x, accel_y, accel_z, timestamp
    FROM machine_beacon_data
    WHERE timestamp BETWEEN ? AND ?
  `;

  db.query(query, [fiveMinutesAgo, now], (err, results) => {
    if (err) {
      console.error("❌ Error querying machine_beacon_data:", err);
      return;
    }

    console.log(`✅ Retrieved ${results.length} records from machine_beacon_data`);

    const machineActivity = {};

    results.forEach((row) => {
      const magnitude = Math.sqrt(
        Math.pow(row.accel_x, 2) + Math.pow(row.accel_y, 2) + Math.pow(row.accel_z, 2)
      );
      console.log(`🔍 Machine ID: ${row.machine_id}, Magnitude: ${magnitude}`);

      const machineId = row.machine_id;

      if (!machineActivity[machineId]) {
        machineActivity[machineId] = { activeCount: 0, totalCount: 0 };
      }

      machineActivity[machineId].totalCount++;
      if (magnitude > 0.5) {
        // Threshold for active state
        machineActivity[machineId].activeCount++;
      }
    });

    Object.keys(machineActivity).forEach((machineId) => {
      const { activeCount, totalCount } = machineActivity[machineId];
      const activityStatus = activeCount / totalCount > 0.5 ? "active" : "idle";

      console.log(
        `📊 Machine ID: ${machineId}, Active Count: ${activeCount}, Total Count: ${totalCount}, Status: ${activityStatus}`
      );

      const insertActivitySql = `
        INSERT INTO machine_activity (machine_id, activity_status, start_time, end_time)
        VALUES (?, ?, ?, ?)
      `;
      db.query(
        insertActivitySql,
        [machineId, activityStatus, fiveMinutesAgo, now],
        (errInsert) => {
          if (errInsert) {
            console.error("❌ Error inserting into machine_activity:", errInsert);
          } else {
            console.log(`✅ Machine ${machineId} activity (${activityStatus}) recorded.`);
          }
        }
      );
    });
  });
}

// ----------------- SCHEDULE TASKS ----------------- //
setInterval(() => {
  console.log("⏰ Triggering processMachineActivity...");
  processMachineActivity();
}, 5 * 60 * 1000); // Run every 5 minutes

// ----------------- UPDATE MACHINE_LOGS EVERY 30 MINUTES ----------------- //
function updateMachineLogs() {
  console.log("🔄 Starting 30-minute machine logs update...");
  const today = new Date().toISOString().split("T")[0];

  console.log(`⏱️ Querying machine_activity for active hours on ${today}`);

  const query = `
    SELECT machine_id, SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) / 3600 AS active_hours
    FROM machine_activity
    WHERE DATE(start_time) = ?
      AND activity_status = 'active'
    GROUP BY machine_id
  `;

  db.query(query, [today], (err, results) => {
    if (err) {
      console.error("❌ Error querying machine_activity:", err);
      return;
    }

    console.log(`✅ Retrieved ${results.length} machines with active hours`);

    results.forEach((row) => {
      const { machine_id, active_hours } = row;

      console.log(`🔍 Machine ID: ${machine_id}, Active Hours: ${active_hours}`);

      const updateLogSql = `
        INSERT INTO machine_logs (machine_id, log_date, hours_worked)
        VALUES (?, CURDATE(), ?)
        ON DUPLICATE KEY UPDATE hours_worked = VALUES(hours_worked)
      `;
      db.query(updateLogSql, [machine_id, active_hours], (errUpdate) => {
        if (errUpdate) {
          console.error("❌ Error updating machine_logs:", errUpdate);
        } else {
          console.log(`✅ Machine logs updated for machine ${machine_id}.`);
        }
      });
    });
  });
}

setInterval(() => {
  console.log("⏰ Triggering updateMachineLogs...");
  updateMachineLogs();
}, 30 * 60 * 1000); // Run every 30 minutes

// ----------------- API: Gateway distances from latest machine location ----------------- //
router.get("/:id/gateway-distances", (req, res) => {
  const machineId = req.params.id;

  // Get machine's latest location
  const locationSql = `
    SELECT latitude, longitude
    FROM machine_location
    WHERE machine_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(locationSql, [machineId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching machine location:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No location found for machine" });
    }

    const { latitude, longitude } = results[0];

    // Haversine formula to calculate distance in meters
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000; // Earth radius in meters
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
          Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Loop through gateways and calculate distance
    const distances = Object.entries(gatewayCoords).map(([gatewayId, coords]) => {
      const distance = getDistance(
        latitude,
        longitude,
        coords.lat,
        coords.lon
      );
      return {
        gateway: gatewayId,
        distance: parseFloat(distance.toFixed(2)) // meters
      };
    });

    res.json(distances);
  });
});

module.exports = router;
