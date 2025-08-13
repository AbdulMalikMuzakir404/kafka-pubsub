const kafka = require("kafka-node");

class KafkaConsumer {
  constructor(brokerHost, topic, groupId, options = {}) {
    this.brokerHost = brokerHost;
    this.topic = topic;
    this.groupId = groupId;
    this.options = {
      connectTimeout: 10000,
      requestTimeout: 30000,
      autoCommit: true,
      autoCommitIntervalMs: 5000,
      fetchMaxWaitMs: 1000,
      fetchMinBytes: 1,
      fetchMaxBytes: 1024 * 1024,
      fromOffset: "latest",
      ...options,
    };

    this.client = null;
    this.consumer = null;
    this.isConnected = false;
    this.messageHandlers = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to Kafka broker: ${this.brokerHost}`);

        this.client = new kafka.KafkaClient({
          kafkaHost: this.brokerHost,
          connectTimeout: this.options.connectTimeout,
          requestTimeout: this.options.requestTimeout,
        });

        this.consumer = new kafka.Consumer(
          this.client,
          [{ topic: this.topic, partition: 0 }],
          {
            groupId: this.groupId,
            autoCommit: this.options.autoCommit,
            autoCommitIntervalMs: this.options.autoCommitIntervalMs,
            fetchMaxWaitMs: this.options.fetchMaxWaitMs,
            fetchMinBytes: this.options.fetchMinBytes,
            fetchMaxBytes: this.options.fetchMaxBytes,
            fromOffset: this.options.fromOffset,
            encoding: "utf8",
          }
        );

        this.consumer.on("message", (message) => {
          this.handleMessage(message);
        });

        this.consumer.on("error", (err) => {
          console.log("❌ Kafka Consumer error:", err.message);
          this.isConnected = false;
          reject(err);
        });

        this.consumer.on("offsetOutOfRange", (err) => {
          console.log("⚠️ Offset out of range:", err.message);
        });

        this.client.on("ready", () => {
          console.log("✅ Kafka Consumer connected successfully");
          console.log(`📡 Listening to topic: ${this.topic}`);
          console.log(`👥 Consumer group: ${this.groupId}`);
          this.isConnected = true;
          resolve();
        });

        this.client.on("error", (err) => {
          console.log("❌ Kafka Client error:", err.message);
          this.isConnected = false;
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(message) {
    console.log("📨 Received message:");
    console.log("  Topic:", message.topic);
    console.log("  Partition:", message.partition);
    console.log("  Offset:", message.offset);
    console.log("  Key:", message.key ? message.key.toString() : "No key");

    // Handle message value properly
    const messageValue = message.value.toString();
    console.log("  Value:", messageValue);
    console.log("  ---");

    // Call registered message handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message, messageValue);
      } catch (error) {
        console.log("❌ Error in message handler:", error.message);
      }
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  async disconnect() {
    return new Promise((resolve) => {
      if (this.consumer) {
        this.consumer.close(true, () => {
          console.log("✅ Consumer closed");
          this.isConnected = false;

          if (this.client) {
            this.client.close(() => {
              console.log("🔌 Kafka Consumer disconnected");
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  isReady() {
    return this.isConnected;
  }
}

// Example usage
async function main() {
  const consumer = new KafkaConsumer(
    "167.71.217.60:29093",
    "test-messages",
    "test-consumer-group"
  );

  // Add custom message handler
  consumer.onMessage((message, value) => {
    console.log("🎯 Custom handler called!");
    console.log(`Processing message: ${value}`);
  });

  try {
    await consumer.connect();
    console.log("🎧 Consumer is running, waiting for messages...");
    console.log("Press Ctrl+C to stop");

    // Keep the process running
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down consumer...");
      await consumer.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Shutting down consumer...");
      await consumer.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.log("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = KafkaConsumer;
