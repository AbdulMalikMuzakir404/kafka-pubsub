const kafka = require("kafka-node");

class KafkaTopicCreator {
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

  async createTopic(topicName, partitions = 1, replicationFactor = 1) {
    return new Promise((resolve, reject) => {
      const topicConfig = {
        topic: topicName,
        partitions: partitions,
        replicationFactor: replicationFactor,
      };

      this.admin.createTopics([topicConfig], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
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

  async topicExists(topicName) {
    const topics = await this.listTopics();
    return topics.includes(topicName);
  }

  async createTopicsForApp() {
    if (!this.isConnected) {
      throw new Error("Not connected to Kafka. Call connect() first.");
    }

    const topics = [
      {
        name: "test-messages",
        partitions: 1,
        replicationFactor: 1,
        description: "Topic untuk testing producer dan consumer",
      },
      {
        name: "user-events",
        partitions: 3,
        replicationFactor: 1,
        description: "Topic untuk user events",
      },
      {
        name: "system-logs",
        partitions: 2,
        replicationFactor: 1,
        description: "Topic untuk system logs",
      },
      {
        name: "notifications",
        partitions: 1,
        replicationFactor: 1,
        description: "Topic untuk notifications",
      },
    ];

    console.log("📋 Creating topics for the application...");

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const topicConfig of topics) {
      try {
        const exists = await this.topicExists(topicConfig.name);

        if (exists) {
          console.log(
            `⏭️  Topic '${topicConfig.name}' already exists, skipping...`
          );
          skippedCount++;
          continue;
        }

        console.log(`🔨 Creating topic: ${topicConfig.name}`);
        console.log(`   Partitions: ${topicConfig.partitions}`);
        console.log(`   Replication Factor: ${topicConfig.replicationFactor}`);
        console.log(`   Description: ${topicConfig.description}`);

        await this.createTopic(
          topicConfig.name,
          topicConfig.partitions,
          topicConfig.replicationFactor
        );

        console.log(`✅ Successfully created topic: ${topicConfig.name}`);
        createdCount++;
      } catch (error) {
        console.log(
          `❌ Failed to create topic ${topicConfig.name}:`,
          error.message
        );
        failedCount++;
      }
    }

    console.log("\n📊 Topic Creation Summary:");
    console.log(`✅ Successfully created: ${createdCount} topics`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} topics`);
    console.log(`❌ Failed to create: ${failedCount} topics`);

    if (failedCount === 0) {
      console.log("🎉 All topics created successfully!");
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
  const creator = new KafkaTopicCreator("167.71.217.60:29093");

  try {
    await creator.connect();
    await creator.createTopicsForApp();
  } catch (error) {
    console.log("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await creator.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = KafkaTopicCreator;
