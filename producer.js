#!/usr/bin/env node

const KafkaPubSubAck = require('./kafka-pubsub-ack');
const KafkaPubSubNoAck = require('./kafka-pubsub-noack');

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  ack: args.includes('--ack'),
  noack: args.includes('--no-ack'),
  json: args.includes('--json'),
  string: args.includes('--string'),
  topic: getFlagValue('--topic') || 'test-messages',
  message: getFlagValue('--message') || 'Hello World',
  help: args.includes('--help') || args.includes('-h')
};

function getFlagValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

function showHelp() {
  console.log("🚀 Enhanced Kafka Producer");
  console.log("==========================");
  console.log("");
  console.log("Usage:");
  console.log("  node producer.js [flags]");
  console.log("");
  console.log("Flags:");
  console.log("  --ack                    Use ACK mode (reliable delivery)");
  console.log("  --no-ack                 Use NoACK mode (high performance)");
  console.log("  --json                   Send JSON message");
  console.log("  --string                 Send string message (default)");
  console.log("  --topic <topic>          Specify topic name (default: test-messages)");
  console.log("  --message <message>      Specify message content");
  console.log("  --help, -h               Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  # Send simple string message with ACK");
  console.log("  node producer.js --ack --string --message 'Hello World'");
  console.log("");
  console.log("  # Send JSON message with NoACK");
  console.log("  node producer.js --no-ack --json --message '{\"type\":\"test\",\"data\":\"value\"}'");
  console.log("");
  console.log("  # Send to specific topic");
  console.log("  node producer.js --ack --json --topic user-events --message '{\"userId\":123}'");
  console.log("");
  console.log("  # Quick examples");
  console.log("  node producer.js --ack --string");
  console.log("  node producer.js --no-ack --json");
  console.log("");
  process.exit(0);
}

async function produceMessage() {
  if (flags.help) {
    showHelp();
  }

  // Validate flags
  if (!flags.ack && !flags.noack) {
    console.log("❌ Error: Must specify either --ack or --no-ack");
    process.exit(1);
  }

  if (!flags.json && !flags.string) {
    console.log("ℹ️  Defaulting to string mode");
    flags.string = true;
  }

  const mode = flags.ack ? 'ACK' : 'NoACK';
  const format = flags.json ? 'JSON' : 'String';
  
  console.log(`📤 Kafka Producer (${mode} mode, ${format} format)`);
  console.log("=============================================");
  console.log(`Topic: ${flags.topic}`);
  console.log(`Message: ${flags.message}`);
  console.log("");

  let pubsub;
  
  if (flags.ack) {
    pubsub = new KafkaPubSubAck(
      "167.71.217.60:29093",
      flags.topic,
      "producer-ack-group"
    );
  } else {
    pubsub = new KafkaPubSubNoAck(
      "167.71.217.60:29093",
      flags.topic,
      "producer-noack-group"
    );
  }

  try {
    await pubsub.connectProducer();
    console.log("✅ Connected to Kafka");

    let messageToSend = flags.message;

    // Validate JSON if --json flag is used
    if (flags.json) {
      try {
        JSON.parse(flags.message);
        console.log("✅ JSON validation passed");
      } catch (error) {
        console.log("❌ Error: Invalid JSON format");
        console.log("Please provide valid JSON string");
        process.exit(1);
      }
    }

    // Send the message
    await pubsub.publish(messageToSend);
    console.log("✅ Message sent successfully!");

  } catch (error) {
    console.log("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pubsub.disconnect();
    console.log("🔌 Disconnected from Kafka");
  }
}

// Run the producer
produceMessage().catch(console.error);
