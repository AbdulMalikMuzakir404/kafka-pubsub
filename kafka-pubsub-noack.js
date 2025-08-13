const kafka = require("kafka-node");

class KafkaPubSubNoAck {
  constructor(brokerHost, topic, groupId, options = {}) {
    this.brokerHost = brokerHost;
    this.topic = topic;
    this.groupId = groupId;
    this.options = {
      // Connection options
      connectTimeout: 10000,
      requestTimeout: 30000,

      // Producer options (no ACK - fire and forget)
      requireAcks: 0,
      ackTimeoutMs: 1000,

      // Consumer options
      autoCommit: true,
      autoCommitIntervalMs: 5000,
      fetchMaxWaitMs: 1000,
      fetchMinBytes: 1,
      fetchMaxBytes: 1024 * 1024,
      fromOffset: false,

      ...options,
    };

    this.client = null;
    this.producer = null;
    this.consumer = null;
    this.isProducerConnected = false;
    this.isConsumerConnected = false;
    this.messageHandlers = [];
  }

  // ==================== PRODUCER METHODS ====================

  async connectProducer() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting producer to Kafka: ${this.brokerHost}`);

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
          console.log("✅ Producer connected successfully (no ACK - fire & forget)");
          this.isProducerConnected = true;
          resolve();
        });

        this.producer.on("error", (err) => {
          console.log("❌ Producer error:", err.message);
          this.isProducerConnected = false;
          reject(err);
        });

        this.client.on("error", (err) => {
          console.log("❌ Client error:", err.message);
          this.isProducerConnected = false;
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async publish(message, key = null) {
    if (!this.isProducerConnected) {
      throw new Error("Producer not connected. Call connectProducer() first.");
    }

    return new Promise((resolve, reject) => {
      const payload = { topic: this.topic, messages: message.toString() };
      this.producer.send([payload], (err, result) => {
        if (err) {
          console.log("❌ Error publishing message:", err.message);
          reject(err);
        } else {
          console.log("✅ Message published successfully (fire & forget)");
          resolve(result);
        }
      });
    });
  }

  async publishBatch(messages) {
    if (!this.isProducerConnected) {
      throw new Error("Producer not connected. Call connectProducer() first.");
    }

    return new Promise((resolve, reject) => {
      const payloads = messages.map((msg) => ({
        topic: this.topic,
        messages: msg.content.toString(),
      }));

      this.producer.send(payloads, (err, result) => {
        if (err) {
          console.log("❌ Error publishing batch:", err.message);
          reject(err);
        } else {
          console.log("✅ Batch published successfully (fire & forget)");
          resolve(result);
        }
      });
    });
  }

  async publishHighVolume(messages) {
    if (!this.isProducerConnected) {
      throw new Error("Producer not connected. Call connectProducer() first.");
    }

    return new Promise((resolve, reject) => {
      const payloads = messages.map((msg) => ({
        topic: this.topic,
        messages: msg.toString(),
      }));

      this.producer.send(payloads, (err, result) => {
        if (err) {
          console.log("❌ Error publishing high volume:", err.message);
          reject(err);
        } else {
          console.log(`✅ High volume published: ${messages.length} messages (fire & forget)`);
          resolve(result);
        }
      });
    });
  }

  async disconnectProducer() {
    return new Promise((resolve) => {
      if (this.producer) {
        this.producer.close(() => {
          console.log("🔌 Producer disconnected");
          this.isProducerConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // ==================== CONSUMER METHODS ====================

  async connectConsumer() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting consumer to Kafka: ${this.brokerHost}`);

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

        // ✅ Fix: Move to latest offset if out of range
        this.consumer.on("offsetOutOfRange", () => {
          console.log("⚠️ Offset out of range detected. Seeking to latest...");
          const offset = new kafka.Offset(this.client);
          offset.fetch(
            [{ topic: this.topic, partition: 0, time: -1, maxNum: 1 }],
            (error, data) => {
              if (error) {
                console.error("❌ Failed to fetch latest offset:", error);
                return;
              }
              const latest = data[this.topic][0][0];
              console.log(`⏩ Moving consumer to offset ${latest}`);
              this.consumer.setOffset(this.topic, 0, latest);
            }
          );
        });

        this.consumer.on("message", (message) => {
          this.handleMessage(message);
        });

        this.consumer.on("error", (err) => {
          console.log("❌ Consumer error:", err.message);
          this.isConsumerConnected = false;
          reject(err);
        });

        this.client.on("ready", () => {
          console.log("✅ Consumer connected successfully");
          console.log(`📡 Listening to topic: ${this.topic}`);
          console.log(`👥 Consumer group: ${this.groupId}`);
          this.isConsumerConnected = true;
          resolve();
        });

        this.client.on("error", (err) => {
          console.log("❌ Client error:", err.message);
          this.isConsumerConnected = false;
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(message) {
    const messageValue = message.value.toString();

    console.log("📨 Received message (no ACK mode):");
    console.log("  Topic:", message.topic);
    console.log("  Partition:", message.partition);
    console.log("  Offset:", message.offset);
    console.log("  Value:", messageValue);
    console.log("  ---");

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

  async disconnectConsumer() {
    return new Promise((resolve) => {
      if (this.consumer) {
        this.consumer.close(true, () => {
          console.log("✅ Consumer closed");
          this.isConsumerConnected = false;
          if (this.client) {
            this.client.close(() => {
              console.log("🔌 Consumer disconnected");
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

  async disconnect() {
    await Promise.all([
      this.disconnectProducer(),
      this.disconnectConsumer(),
    ]);
  }
}

module.exports = KafkaPubSubNoAck;
