const express = require("express");
const axios = require("axios");

const router = express.Router();

const trackingClient = axios.create({
  baseURL: "https://tbtrack.in/gps/public/api/v1",
  headers: {
    username: process.env.TBTRACK_USERNAME || "trackvehicles",
  },
  timeout: 10000,
});

// GET vehicle tracking data - proxy the external API response
router.get("/vehicles/location/data", async (req, res) => {
  try {
    const response = await trackingClient.get("/vehicles/location/data", {
      params: req.query,
    });
    return res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).send(error.response.data);
    }

    return res.status(502).json({
      error: "Failed to reach vehicle tracking service",
      message: error.message,
    });
  }
});

module.exports = router;
