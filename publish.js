// mqtt_publisher.js
const mqtt = require("mqtt");

// Connect to HiveMQ public broker
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");

  // Publish test data every 3 seconds
  setInterval(() => {
    // Simulated beacon data for beacon_001 from 3 gateways
    const testMessages = [
      {
        deviceId: "beacon_001",
        gatewayId: "Gateway-A",
        timestamp: new Date().toISOString(),
        rssi: -72,
        txPower: -4,
        accelerometer: { x: 0.12, y: -0.88, z: 9.61 },
        batteryLevel: 94,
        status: "active"
      },
      {
        deviceId: "beacon_001",
        gatewayId: "Gateway-B",
        timestamp: new Date().toISOString(),
        rssi: -63,
        txPower: -4,
        accelerometer: { x: 0.15, y: -0.82, z: 9.41 },
        batteryLevel: 93,
        status: "active"
      },
      {
        deviceId: "beacon_001",
        gatewayId: "Gateway-C",
        timestamp: new Date().toISOString(),
        rssi: -52,
        txPower: -4,
        accelerometer: { x: 0.18, y: -0.79, z: 9.31 },
        batteryLevel: 92,
        status: "active"
      }
    ];

    // Publish each message separately to simulate real multi-gateway data
    testMessages.forEach(msg => {
      client.publish("beacons/data", JSON.stringify(msg), { qos: 0 }, (err) => {
        if (err) {
          console.error("❌ Publish error:", err);
        } else {
          console.log("📤 Published:", msg.gatewayId, msg);
        }
      });
    });

  }, 30000); // every 3 seconds
});
