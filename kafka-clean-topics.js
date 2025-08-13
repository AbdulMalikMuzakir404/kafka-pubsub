const kafka = require("kafka-node");

class KafkaTopicCleaner {
  constructor(brokerHost) {
    this.brokerHost = brokerHost;
    this.client = null;
    this.admin = null;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to Kafka broker: ${this.brokerHost}`);

        this.client = new kafka.KafkaClient({
          kafkaHost: this.brokerHost,
          connectTimeout: 10000,
          requestTimeout: 30000,
        });

        this.admin = new kafka.Admin(this.client);

        this.client.on("ready", () => {
          console.log("✅ Kafka Admin connected successfully");
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

  async listTopics() {
    return new Promise((resolve, reject) => {
      this.admin.listTopics((err, topics) => {
        if (err) {
          reject(err);
        } else {
          resolve(topics);
        }
      });
    });
  }

  async deleteTopic(topicName) {
    return new Promise((resolve, reject) => {
      this.admin.deleteTopics([topicName], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  getDefaultTopics() {
    return [
      "__consumer_offsets",
      "__transaction_state",
      "connect-configs",
      "connect-offsets",
      "connect-status",
      "connect-status-5",
      "connect-configs-5",
      "connect-offsets-5",
    ];
  }

  async cleanTopics() {
    if (!this.isConnected) {
      throw new Error("Not connected to Kafka. Call connect() first.");
    }

    try {
      console.log("📋 Fetching all topics...");
      const allTopics = await this.listTopics();
      const defaultTopics = this.getDefaultTopics();

      console.log(`📊 Found ${allTopics.length} total topics`);
      console.log("🔒 Default topics (will be preserved):", defaultTopics);

      const topicsToDelete = allTopics.filter(
        (topic) => !defaultTopics.includes(topic)
      );

      if (topicsToDelete.length === 0) {
        console.log("✅ No custom topics found to delete");
        return;
      }

      console.log(
        `🗑️  Topics to delete (${topicsToDelete.length}):`,
        topicsToDelete
      );

      let deletedCount = 0;
      let failedCount = 0;

      for (const topic of topicsToDelete) {
        try {
          console.log(`🗑️  Deleting topic: ${topic}`);
          await this.deleteTopic(topic);
          console.log(`✅ Successfully deleted topic: ${topic}`);
          deletedCount++;
        } catch (error) {
          console.log(`❌ Failed to delete topic ${topic}:`, error.message);
          failedCount++;
        }
      }

      console.log(`\n📊 Cleanup Summary:`);
      console.log(`✅ Successfully deleted: ${deletedCount} topics`);
      console.log(`❌ Failed to delete: ${failedCount} topics`);
      console.log(`🔒 Preserved default topics: ${defaultTopics.length}`);
    } catch (error) {
      console.log("❌ Error during topic cleanup:", error.message);
      throw error;
    }
  }

  async disconnect() {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.close(() => {
          console.log("🔌 Kafka Admin disconnected");
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

async function main() {
  const cleaner = new KafkaTopicCleaner("167.71.217.60:29093");

  try {
    await cleaner.connect();
    await cleaner.cleanTopics();
  } catch (error) {
    console.log("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await cleaner.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = KafkaTopicCleaner;
