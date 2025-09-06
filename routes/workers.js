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
    if (err) return res.status(500).json({ error: "Database error" });
    if (workerResults.length === 0)
      return res.status(404).json({ error: "Worker not found" });

    const params = date ? [workerId, date] : [workerId];
    db.query(logsSql, params, (err2, logResults) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      res.json({
        worker: workerResults[0],
        logs: logResults,
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
      res.json({ message: "Worker added successfully", workerId: result.insertId });
    }
  );
});

module.exports = router;
