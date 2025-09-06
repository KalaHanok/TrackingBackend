const mqtt = require("mqtt");

// Connect to HiveMQ public broker on TCP
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Topic to subscribe to
const topic = "beacons/data";

// Handle connection
client.on("connect", () => {
  console.log("✅ Connected to HiveMQ public broker");

  // Subscribe to the topic
  client.subscribe(topic, (err) => {
    if (err) {
      console.error("❌ Subscription error:", err);
    } else {
      console.log(`📡 Subscribed to topic: ${topic}`);
      console.log("Waiting for incoming messages...\n");
    }
  });
});

// Handle incoming messages
client.on("message", (receivedTopic, message) => {
  if (receivedTopic === topic) {
    try {
      const data = JSON.parse(message.toString());
      console.log("📥 Message received:", data);
    } catch (err) {
      console.log("📥 Message received (raw):", message.toString());
    }
  }
});

// Handle errors
client.on("error", (err) => {
  console.error("❌ MQTT error:", err);
});
