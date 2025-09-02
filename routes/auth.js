const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Login route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (results.length > 0) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.json({ success: false, message: "Invalid email or password" });
    }
  });
});

module.exports = router;
