const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const workerRoutes = require("./routes/workers");
app.use("/api/workers", workerRoutes);

const truckRoutes = require("./routes/trucks");
app.use("/api/trucks", truckRoutes);

const machinesRoutes = require("./routes/machines");
app.use("/machines", machinesRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Start Server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
