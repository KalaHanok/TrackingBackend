const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Get all machines
router.get("/", (req, res) => {
  const sql = "SELECT id, name, role, description, image FROM machines";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// ✅ Add new machine
router.post("/", (req, res) => {
  const { name, role, description, image } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql =
    "INSERT INTO machines (name, role, description, image) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, role, description, image], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
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
