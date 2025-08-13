const KafkaPubSubAck = require("./kafka-pubsub-ack");
const KafkaPubSubNoAck = require("./kafka-pubsub-noack");

// Pilih salah satu mode: 'ack' atau 'noack'
const MODE = process.argv[2] || "ack";

async function listenToJsonTopic() {
  console.log(`🎧 Listening to json-test-topic (${MODE.toUpperCase()} mode)`);
  console.log("================================================");

  let pubsub;

  if (MODE === "ack") {
    pubsub = new KafkaPubSubAck(
      "167.71.217.60:29093",
      "json-test-topic",
      "json-listener-ack-group"
    );
  } else {
    pubsub = new KafkaPubSubNoAck(
      "167.71.217.60:29093",
      "json-test-topic",
      "json-listener-noack-group"
    );
  }

  // Handler untuk memproses JSON messages
  pubsub.onMessage((message, value) => {
    try {
      const jsonData = JSON.parse(value);

      console.log(`📨 Received ${jsonData.type} event:`);
      console.log(`  Timestamp: ${jsonData.timestamp}`);

      // Handle different message types
      switch (jsonData.type) {
        case "user_created":
          console.log(
            `  👤 User: ${jsonData.data.username} (${jsonData.data.email})`
          );
          console.log(
            `  ID: ${jsonData.data.userId}, Age: ${jsonData.data.age}`
          );
          break;

        case "order_placed":
          console.log(`  🛒 Order: ${jsonData.data.orderId}`);
          console.log(`  Customer: ${jsonData.data.customerId}`);
          console.log(`  Total: $${jsonData.data.totalAmount}`);
          console.log(`  Items: ${jsonData.data.items.length} products`);
          break;

        case "system_alert":
          console.log(`  ⚠️  Alert: ${jsonData.data.level.toUpperCase()}`);
          console.log(`  Message: ${jsonData.data.message}`);
          console.log(`  Server: ${jsonData.data.serverId}`);
          console.log(
            `  CPU: ${jsonData.data.cpuUsage}%, Memory: ${jsonData.data.memoryUsage}%`
          );
          break;

        case "page_view":
          console.log(`  🌐 Page: ${jsonData.data.pageId}`);
          console.log(`  User: ${jsonData.data.userId}`);
          console.log(`  Session: ${jsonData.data.sessionId}`);
          break;

        case "user_action":
          console.log(`  🎯 Action: ${jsonData.data.action}`);
          console.log(`  User: ${jsonData.data.userId}`);
          console.log(`  Element: ${jsonData.data.elementId}`);
          console.log(`  Page: ${jsonData.data.pageUrl}`);
          break;

        case "application_log":
          console.log(`  📝 Log: ${jsonData.data.level.toUpperCase()}`);
          console.log(`  Message: ${jsonData.data.message}`);
          console.log(`  User: ${jsonData.data.userId}`);
          console.log(`  Duration: ${jsonData.data.duration}ms`);
          break;

        case "system_metrics":
          console.log(`  📊 Metrics for ${jsonData.data.serverId}:`);
          console.log(`  CPU: ${jsonData.data.cpuUsage}%`);
          console.log(`  Memory: ${jsonData.data.memoryUsage}%`);
          console.log(`  Disk: ${jsonData.data.diskUsage}%`);
          console.log(`  Connections: ${jsonData.data.activeConnections}`);
          break;

        case "notification_sent":
          console.log(`  📧 Notification: ${jsonData.data.notificationType}`);
          console.log(`  User: ${jsonData.data.userId}`);
          console.log(`  Subject: ${jsonData.data.subject}`);
          console.log(`  Status: ${jsonData.data.status}`);
          break;

        case "cache_updated":
          console.log(`  💾 Cache: ${jsonData.data.operation}`);
          console.log(`  Key: ${jsonData.data.cacheKey}`);
          console.log(`  Size: ${jsonData.data.size} bytes`);
          console.log(`  TTL: ${jsonData.data.ttl} seconds`);
          break;

        case "database_query":
          console.log(`  🗄️  Query: ${jsonData.data.query}`);
          console.log(`  Table: ${jsonData.data.table}`);
          console.log(`  Duration: ${jsonData.data.duration}ms`);
          console.log(`  Rows: ${jsonData.data.rowsReturned}`);
          break;

        default:
          console.log(`  📋 Unknown type: ${jsonData.type}`);
          console.log(`  Data:`, jsonData.data);
      }

      console.log("  ---");
    } catch (error) {
      console.log("❌ Error parsing JSON:", error.message);
      console.log("  Raw value:", value);
      console.log("  ---");
    }
  });

  try {
    // Connect consumer only (tidak perlu producer untuk listening)
    await pubsub.connectConsumer();

    console.log("✅ Connected to json-test-topic");
    console.log(`📡 Listening for messages in ${MODE.toUpperCase()} mode...`);
    console.log("Press Ctrl+C to stop listening");
    console.log("");

    // Keep the process running
    process.on("SIGINT", async () => {
      console.log("\n🛑 Stopping listener...");
      await pubsub.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Stopping listener...");
      await pubsub.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.log("❌ Error:", error.message);
    await pubsub.disconnect();
    process.exit(1);
  }
}

// Usage instructions
if (process.argv.includes("--help")) {
  console.log("🎧 JSON Topic Listener");
  console.log("======================");
  console.log("");
  console.log("Usage:");
  console.log("  bun run listen-json-topic.js ack     # Listen with ACK mode");
  console.log(
    "  bun run listen-json-topic.js noack   # Listen with NoACK mode"
  );
  console.log("  bun run listen-json-topic.js --help  # Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  bun run listen-json-topic.js ack");
  console.log("  bun run listen-json-topic.js noack");
  console.log("");
  console.log("Features:");
  console.log("  ✅ Real-time JSON message parsing");
  console.log("  ✅ Type-specific message handling");
  console.log("  ✅ Formatted output for different event types");
  console.log("  ✅ Error handling for malformed JSON");
  console.log("  ✅ Graceful shutdown with Ctrl+C");
  process.exit(0);
}

// Run the listener
listenToJsonTopic().catch(console.error);
