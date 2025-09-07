// publisher.js
const mqtt = require("mqtt");

// Connect to HiveMQ public broker
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Predefined sample events (like your table screenshot)
const sampleEvents = [
  {
    latitude: 17.240300,
    longitude: 78.429400,
    altitude: 542.5,
    speed_kmph: 40.2,
    heading_degrees: 135.0,
    ignition: 1,
    battery_level: 88,
    signal_strength: "strong",
    gps_fix: 1,
    event_type: "movement",
    event_description: "Vehicle started moving",
    geofence_alert: 0,
  },
  {
    latitude: 17.250100,
    longitude: 78.439800,
    altitude: 545.0,
    speed_kmph: 48.7,
    heading_degrees: 140.0,
    ignition: 1,
    battery_level: 87,
    signal_strength: "strong",
    gps_fix: 1,
    event_type: "movement",
    event_description: "Vehicle moving on route",
    geofence_alert: 0,
  },
  {
    latitude: 17.260200,
    longitude: 78.448200,
    altitude: 543.8,
    speed_kmph: 35.5,
    heading_degrees: 132.0,
    ignition: 1,
    battery_level: 86,
    signal_strength: "medium",
    gps_fix: 1,
    event_type: "idle",
    event_description: "Vehicle stopped at site",
    geofence_alert: 0,
  },
  {
    latitude: 17.270500,
    longitude: 78.452300,
    altitude: 546.2,
    speed_kmph: 55.0,
    heading_degrees: 145.0,
    ignition: 1,
    battery_level: 85,
    signal_strength: "strong",
    gps_fix: 1,
    event_type: "movement",
    event_description: "Vehicle in transit",
    geofence_alert: 0,
  },
  {
    latitude: 17.280400,
    longitude: 78.460200,
    altitude: 547.5,
    speed_kmph: 42.3,
    heading_degrees: 138.0,
    ignition: 1,
    battery_level: 83,
    signal_strength: "strong",
    gps_fix: 1,
    event_type: "movement",
    event_description: "Vehicle in transit",
    geofence_alert: 0,
  },
];

// Function to generate data with today’s date/time
function generateTruckData(base, index) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + index * 5); // each event spaced by 5 minutes
  return {
    truck_id: 1,
    device_id: "GT-001",
    timestamp: now.toISOString().slice(0, 19).replace("T", " "), // MySQL DATETIME format
    ...base,
  };
}

client.on("connect", () => {
  console.log("✅ Publisher connected to HiveMQ broker");

  let i = 0;
  const interval = setInterval(() => {
    if (i >= sampleEvents.length) {
      clearInterval(interval);
      console.log("✅ All sample events published");
      client.end();
      return;
    }

    const data = generateTruckData(sampleEvents[i], i);
    client.publish("trucks/gps", JSON.stringify(data), { qos: 0 }, (err) => {
      if (err) {
        console.error("❌ Publish error:", err);
      } else {
        console.log(`📡 Event ${i + 1} published:`, data);
      }
    });

    i++;
  }, 5000); // publish one event every 5 seconds
});
