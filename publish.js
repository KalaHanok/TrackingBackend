const mqtt = require("mqtt");

// Connect to HiveMQ public broker
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Topic to publish to
const topic = "beacons/data";

// Get current date/time in ISO format
const now = new Date().toISOString();

// Sample beacon data
const message = {
  deviceId: "beacon_001",
  timestamp: now,
  accelerometer: {
    x: 0.12,
    y: -0.98,
    z: 9.81
  },
  gatewayId: "Gateway-A",
  rssi: -72,
  txPower: -4,
  batteryLevel: 87,
  status: "active"
};

// Connect & publish
client.on("connect", () => {
  console.log("✅ Connected to HiveMQ");
  client.publish(topic, JSON.stringify(message), { qos: 1, retain: false }, (err) => {
    if (err) console.error("❌ Publish error:", err);
    else console.log("🚀 Published message to beacons/data:", message);
    client.end(); // Disconnect after publishing
  });
});
