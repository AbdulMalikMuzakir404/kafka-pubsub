#!/usr/bin/env node

const kafka = require("kafka-node");

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  topic: getFlagValue('--topic'),
  partitions: parseInt(getFlagValue('--partitions')) || 1,
  replication: parseInt(getFlagValue('--replication')) || 1,
  all: args.includes('--all'),
  help: args.includes('--help') || args.includes('-h')
};

function getFlagValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

function showHelp() {
  console.log("🔨 Enhanced Kafka Topic Creator");
  console.log("================================");
  console.log("");
  console.log("Usage:");
  console.log("  node create-topics.js [flags]");
  console.log("");
  console.log("Flags:");
  console.log("  --topic <name>            Create specific topic");
  console.log("  --partitions <number>     Number of partitions (default: 1)");
  console.log("  --replication <number>    Replication factor (default: 1)");
  console.log("  --all                     Create all default topics");
  console.log("  --help, -h                Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  # Create specific topic");
  console.log("  node create-topics.js --topic my-topic --partitions 3");
  console.log("");
  console.log("  # Create all default topics");
  console.log("  node create-topics.js --all");
  console.log("");
  console.log("  # Quick examples");
  console.log("  node create-topics.js --topic user-events");
  console.log("  node create-topics.js --all");
  console.log("");
  process.exit(0);
}

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

async function createTopics() {
  if (flags.help) {
    showHelp();
  }

  const creator = new KafkaTopicCreator("167.71.217.60:29093");

  try {
    await creator.connect();

    if (flags.all) {
      // Create all default topics
      const defaultTopics = [
        {
          name: "test-messages",
          partitions: 1,
          replication: 1,
          description: "Topic untuk testing producer dan consumer"
        },
        {
          name: "user-events",
          partitions: 3,
          replication: 1,
          description: "Topic untuk user events"
        },
        {
          name: "system-logs",
          partitions: 2,
          replication: 1,
          description: "Topic untuk system logs"
        },
        {
          name: "notifications",
          partitions: 1,
          replication: 1,
          description: "Topic untuk notifications"
        },
        {
          name: "json-test-topic",
          partitions: 1,
          replication: 1,
          description: "Topic untuk testing JSON messages"
        }
      ];

      console.log("📋 Creating all default topics...");
      
      let createdCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const topicConfig of defaultTopics) {
        try {
          const exists = await creator.topicExists(topicConfig.name);
          
          if (exists) {
            console.log(`⏭️  Topic '${topicConfig.name}' already exists, skipping...`);
            skippedCount++;
            continue;
          }

          console.log(`🔨 Creating topic: ${topicConfig.name}`);
          console.log(`   Partitions: ${topicConfig.partitions}`);
          console.log(`   Replication Factor: ${topicConfig.replication}`);
          console.log(`   Description: ${topicConfig.description}`);
          
          await creator.createTopic(
            topicConfig.name,
            topicConfig.partitions,
            topicConfig.replication
          );
          
          console.log(`✅ Successfully created topic: ${topicConfig.name}`);
          createdCount++;
          
        } catch (error) {
          console.log(`❌ Failed to create topic ${topicConfig.name}:`, error.message);
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

    } else if (flags.topic) {
      // Create specific topic
      console.log(`🔨 Creating topic: ${flags.topic}`);
      console.log(`   Partitions: ${flags.partitions}`);
      console.log(`   Replication Factor: ${flags.replication}`);
      
      const exists = await creator.topicExists(flags.topic);
      
      if (exists) {
        console.log(`⏭️  Topic '${flags.topic}' already exists`);
      } else {
        await creator.createTopic(flags.topic, flags.partitions, flags.replication);
        console.log(`✅ Successfully created topic: ${flags.topic}`);
      }

    } else {
      console.log("❌ Error: Must specify either --topic or --all");
      console.log("Use --help for usage information");
      process.exit(1);
    }

  } catch (error) {
    console.log("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await creator.disconnect();
  }
}

// Run the topic creator
createTopics().catch(console.error);
