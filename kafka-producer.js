const kafka = require("kafka-node");

class KafkaProducer {
  constructor(brokerHost, topic, options = {}) {
    this.brokerHost = brokerHost;
    this.topic = topic;
    this.options = {
      connectTimeout: 10000,
      requestTimeout: 30000,
      requireAcks: 0, // No ack for faster performance (fire and forget)
      ackTimeoutMs: 1000,
      ...options,
    };

    this.client = null;
    this.producer = null;
    this.isConnected = false;
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

        this.producer = new kafka.Producer(this.client, {
          requireAcks: this.options.requireAcks,
          ackTimeoutMs: this.options.ackTimeoutMs,
        });

        this.producer.on("ready", () => {
          console.log("✅ Kafka Producer connected successfully");
          this.isConnected = true;
          resolve();
        });

        this.producer.on("error", (err) => {
          console.log("❌ Kafka Producer error:", err.message);
          this.isConnected = false;
          reject(err);
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

  async sendMessage(message, key = null) {
    if (!this.isConnected) {
      throw new Error("Producer not connected. Call connect() first.");
    }

    return new Promise((resolve, reject) => {
      // Ensure message is always a string
      const messageValue = message.toString();

      const payload = {
        topic: this.topic,
        messages: messageValue,
      };

      this.producer.send([payload], (err, result) => {
        if (err) {
          console.log("❌ Error sending message:", err.message);
          reject(err);
        } else {
          console.log("✅ Message sent successfully");
          resolve(result);
        }
      });
    });
  }

  async sendBatch(messages) {
    if (!this.isConnected) {
      throw new Error("Producer not connected. Call connect() first.");
    }

    return new Promise((resolve, reject) => {
      const payloads = messages.map((msg) => {
        // Ensure content is always a string
        const contentValue = msg.content.toString();

        return {
          topic: this.topic,
          messages: contentValue,
        };
      });

      this.producer.send(payloads, (err, result) => {
        if (err) {
          console.log("❌ Error sending batch:", err.message);
          reject(err);
        } else {
          console.log("✅ Batch messages sent successfully");
          resolve(result);
        }
      });
    });
  }

  async disconnect() {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.close(() => {
          console.log("🔌 Kafka Producer disconnected");
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Example usage
async function main() {
  const producer = new KafkaProducer("167.71.217.60:29093", "test-messages");

  try {
    await producer.connect();

    // Send single message
    await producer.sendMessage("Hello from production producer!");

    // Send message with key
    await producer.sendMessage("Message with key", "user-123");

    // Send simple string message
    await producer.sendMessage("Simple string message", "simple-key");

    // Send batch messages
    const batchMessages = [
      { content: "Batch message 1", key: "batch-1" },
      { content: "Batch message 2", key: "batch-2" },
      { content: "Batch message 3", key: "batch-3" },
    ];
    await producer.sendBatch(batchMessages);
  } catch (error) {
    console.log("❌ Error:", error.message);
  } finally {
    await producer.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = KafkaProducer;
