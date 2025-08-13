const kafka = require("kafka-node");

class KafkaPubSubAck {
  constructor(brokerHost, topic, groupId, options = {}) {
    this.brokerHost = brokerHost;
    this.topic = topic;
    this.groupId = groupId;
    this.options = {
      connectTimeout: 10000,
      requestTimeout: 30000,
      requireAcks: 1,
      ackTimeoutMs: 5000,
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

        this.consumer.on("offsetOutOfRange", (err) => {
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
          console.log("✅ Producer connected successfully");
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

  async publish(message) {
    if (!this.isProducerConnected) {
      throw new Error("Producer not connected");
    }

    return new Promise((resolve, reject) => {
      this.producer.send(
        [{ topic: this.topic, messages: [message] }],
        (err, data) => {
          if (err) {
            console.log("❌ Failed to send message:", err);
            reject(err);
          } else {
            console.log("📨 Message sent:", data);
            resolve(data);
          }
        }
      );
    });
  }

  handleMessage(message) {
    console.log("📥 Message received:", message);
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  async disconnect() {
    if (this.consumer) {
      this.consumer.close(true, () => {
        console.log("👋 Consumer disconnected");
      });
    }
    if (this.producer) {
      this.producer.close(() => {
        console.log("👋 Producer disconnected");
      });
    }
    if (this.client) {
      this.client.close(() => {
        console.log("👋 Kafka client disconnected");
      });
    }
  }
}

module.exports = KafkaPubSubAck;
