const mysql = require("mysql2");

// Create connection pool (recommended over single connection)
const db = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASS ,
  database: process.env.DB_NAME ,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ MySQL Connected to AWS RDS...");
    connection.release();
  }
});

module.exports = db;