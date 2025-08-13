#!/usr/bin/env node

const kafka = require("kafka-node");

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  topic: getFlagValue('--topic'),
  all: args.includes('--all'),
  force: args.includes('--force'),
  help: args.includes('--help') || args.includes('-h')
};

function getFlagValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

function showHelp() {
  console.log("🗑️  Enhanced Kafka Topic Cleaner");
  console.log("=================================");
  console.log("");
  console.log("Usage:");
  console.log("  node clean-topics.js [flags]");
  console.log("");
  console.log("Flags:");
  console.log("  --topic <name>            Clean specific topic");
  console.log("  --all                     Clean all custom topics (preserve system topics)");
  console.log("  --force                   Skip confirmation prompt");
  console.log("  --help, -h                Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  # Clean specific topic");
  console.log("  node clean-topics.js --topic my-topic");
  console.log("");
  console.log("  # Clean all custom topics");
  console.log("  node clean-topics.js --all");
  console.log("");
  console.log("  # Force clean without confirmation");
  console.log("  node clean-topics.js --all --force");
  console.log("");
  process.exit(0);
}

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
      "connect-offsets-5"
    ];
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

async function cleanTopics() {
  if (flags.help) {
    showHelp();
  }

  const cleaner = new KafkaTopicCleaner("167.71.217.60:29093");

  try {
    await cleaner.connect();

    if (flags.topic) {
      // Clean specific topic
      console.log(`🗑️  Cleaning topic: ${flags.topic}`);
      
      if (!flags.force) {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise((resolve) => {
          rl.question(`⚠️  Are you sure you want to delete topic '${flags.topic}'? (y/N): `, resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log("❌ Operation cancelled");
          return;
        }
      }

      try {
        await cleaner.deleteTopic(flags.topic);
        console.log(`✅ Successfully deleted topic: ${flags.topic}`);
      } catch (error) {
        console.log(`❌ Failed to delete topic ${flags.topic}:`, error.message);
      }

    } else if (flags.all) {
      // Clean all custom topics
      console.log("🗑️  Cleaning all custom topics...");
      
      const allTopics = await cleaner.listTopics();
      const defaultTopics = cleaner.getDefaultTopics();
      
      console.log(`📊 Found ${allTopics.length} total topics`);
      console.log("🔒 Default topics (will be preserved):", defaultTopics);

      const topicsToDelete = allTopics.filter(topic => !defaultTopics.includes(topic));
      
      if (topicsToDelete.length === 0) {
        console.log("✅ No custom topics found to delete");
        return;
      }

      console.log(`🗑️  Topics to delete (${topicsToDelete.length}):`, topicsToDelete);

      if (!flags.force) {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise((resolve) => {
          rl.question(`⚠️  Are you sure you want to delete ${topicsToDelete.length} topics? (y/N): `, resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log("❌ Operation cancelled");
          return;
        }
      }

      let deletedCount = 0;
      let failedCount = 0;

      for (const topic of topicsToDelete) {
        try {
          console.log(`🗑️  Deleting topic: ${topic}`);
          await cleaner.deleteTopic(topic);
          console.log(`✅ Successfully deleted topic: ${topic}`);
          deletedCount++;
        } catch (error) {
          console.log(`❌ Failed to delete topic ${topic}:`, error.message);
          failedCount++;
        }
      }

      console.log("\n📊 Cleanup Summary:");
      console.log(`✅ Successfully deleted: ${deletedCount} topics`);
      console.log(`❌ Failed to delete: ${failedCount} topics`);
      console.log(`🔒 Preserved default topics: ${defaultTopics.length}`);

      if (failedCount === 0) {
        console.log("🎉 Topic cleanup completed successfully!");
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
    await cleaner.disconnect();
  }
}

// Run the topic cleaner
cleanTopics().catch(console.error);
