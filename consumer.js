#!/usr/bin/env node

const KafkaPubSubAck = require('./kafka-pubsub-ack');
const KafkaPubSubNoAck = require('./kafka-pubsub-noack');

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  ack: args.includes('--ack'),
  noack: args.includes('--no-ack'),
  topic: getFlagValue('--topic') || 'test-messages',
  group: getFlagValue('--group') || 'default-consumer-group',
  help: args.includes('--help') || args.includes('-h')
};

function getFlagValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

function showHelp() {
  console.log("🎧 Enhanced Kafka Consumer");
  console.log("==========================");
  console.log("");
  console.log("Usage:");
  console.log("  node consumer.js [flags]");
  console.log("");
  console.log("Flags:");
  console.log("  --ack                    Use ACK mode (reliable delivery)");
  console.log("  --no-ack                 Use NoACK mode (high performance)");
  console.log("  --topic <topic>          Specify topic name (default: test-messages)");
  console.log("  --group <group>          Specify consumer group (default: default-consumer-group)");
  console.log("  --help, -h               Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  # Listen with ACK mode");
  console.log("  node consumer.js --ack --topic test-messages");
  console.log("");
  console.log("  # Listen with NoACK mode");
  console.log("  node consumer.js --no-ack --topic user-events --group user-processor");
  console.log("");
  console.log("  # Quick examples");
  console.log("  node consumer.js --ack");
  console.log("  node consumer.js --no-ack --topic json-test-topic");
  console.log("");
  process.exit(0);
}

async function consumeMessages() {
  if (flags.help) {
    showHelp();
  }

  // Validate flags
  if (!flags.ack && !flags.noack) {
    console.log("❌ Error: Must specify either --ack or --no-ack");
    process.exit(1);
  }

  const mode = flags.ack ? 'ACK' : 'NoACK';
  
  console.log(`🎧 Kafka Consumer (${mode} mode)`);
  console.log("=================================");
  console.log(`Topic: ${flags.topic}`);
  console.log(`Consumer Group: ${flags.group}`);
  console.log("");

  let pubsub;
  
  if (flags.ack) {
    pubsub = new KafkaPubSubAck(
      "167.71.217.60:29093",
      flags.topic,
      flags.group
    );
  } else {
    pubsub = new KafkaPubSubNoAck(
      "167.71.217.60:29093",
      flags.topic,
      flags.group
    );
  }

  // Enhanced message handler for both JSON and string
  pubsub.onMessage((message, value) => {
    const timestamp = new Date().toLocaleString();
    
    console.log(`📨 [${timestamp}] Received message:`);
    console.log(`  Topic: ${message.topic}`);
    console.log(`  Partition: ${message.partition}`);
    console.log(`  Offset: ${message.offset}`);
    console.log(`  Key: ${message.key ? message.key.toString() : 'No key'}`);
    
    // Try to parse as JSON, if fails treat as string
    try {
      const jsonData = JSON.parse(value);
      
      // Check if it's a structured JSON with type field
      if (jsonData.type) {
        console.log(`  Type: ${jsonData.type}`);
        console.log(`  Format: JSON (Structured)`);
        
        // Handle different JSON types
        switch (jsonData.type) {
          case 'user_created':
            console.log(`  👤 User: ${jsonData.data.username} (${jsonData.data.email})`);
            console.log(`  ID: ${jsonData.data.userId}, Age: ${jsonData.data.age}`);
            break;
            
          case 'order_placed':
            console.log(`  🛒 Order: ${jsonData.data.orderId}`);
            console.log(`  Customer: ${jsonData.data.customerId}`);
            console.log(`  Total: $${jsonData.data.totalAmount}`);
            console.log(`  Items: ${jsonData.data.items.length} products`);
            break;
            
          case 'system_alert':
            console.log(`  ⚠️  Alert: ${jsonData.data.level.toUpperCase()}`);
            console.log(`  Message: ${jsonData.data.message}`);
            console.log(`  Server: ${jsonData.data.serverId}`);
            break;
            
          case 'page_view':
            console.log(`  🌐 Page: ${jsonData.data.pageId}`);
            console.log(`  User: ${jsonData.data.userId}`);
            console.log(`  Session: ${jsonData.data.sessionId}`);
            break;
            
          case 'user_action':
            console.log(`  🎯 Action: ${jsonData.data.action}`);
            console.log(`  User: ${jsonData.data.userId}`);
            console.log(`  Element: ${jsonData.data.elementId}`);
            break;
            
          case 'application_log':
            console.log(`  📝 Log: ${jsonData.data.level.toUpperCase()}`);
            console.log(`  Message: ${jsonData.data.message}`);
            console.log(`  Duration: ${jsonData.data.duration}ms`);
            break;
            
          case 'system_metrics':
            console.log(`  📊 Metrics for ${jsonData.data.serverId}:`);
            console.log(`  CPU: ${jsonData.data.cpuUsage}%, Memory: ${jsonData.data.memoryUsage}%`);
            break;
            
          case 'notification_sent':
            console.log(`  📧 Notification: ${jsonData.data.notificationType}`);
            console.log(`  Subject: ${jsonData.data.subject}`);
            console.log(`  Status: ${jsonData.data.status}`);
            break;
            
          case 'cache_updated':
            console.log(`  💾 Cache: ${jsonData.data.operation}`);
            console.log(`  Key: ${jsonData.data.cacheKey}`);
            console.log(`  Size: ${jsonData.data.size} bytes`);
            break;
            
          case 'database_query':
            console.log(`  🗄️  Query: ${jsonData.data.query}`);
            console.log(`  Table: ${jsonData.data.table}`);
            console.log(`  Duration: ${jsonData.data.duration}ms`);
            break;
            
          default:
            console.log(`  📋 Unknown type: ${jsonData.type}`);
            console.log(`  Data:`, jsonData.data);
        }
      } else {
        // Generic JSON without type field
        console.log(`  Format: JSON (Generic)`);
        console.log(`  Data:`, jsonData);
      }
      
    } catch (error) {
      // Treat as plain string
      console.log(`  Format: String`);
      console.log(`  Value: ${value}`);
    }
    
    console.log("  ---");
  });

  try {
    console.log("🔄 Resetting consumer offsets to latest...");
    await pubsub.resetOffsetsToLatest();

    await pubsub.connectConsumer();
    
    console.log("✅ Connected to Kafka");
    console.log(`📡 Listening for messages in ${mode} mode...`);
    console.log("Press Ctrl+C to stop listening");
    console.log("");

    // Keep the process running
    process.on("SIGINT", async () => {
      console.log("\n🛑 Stopping consumer...");
      await pubsub.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Stopping consumer...");
      await pubsub.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.log("❌ Error:", error.message);
    await pubsub.disconnect();
    process.exit(1);
  }
}

// Run the consumer
consumeMessages().catch(console.error);
