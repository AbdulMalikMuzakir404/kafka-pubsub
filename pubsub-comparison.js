const KafkaPubSubAck = require("./kafka-pubsub-ack");
const KafkaPubSubNoAck = require("./kafka-pubsub-noack");

class PubSubComparison {
  constructor(brokerHost, topic) {
    this.brokerHost = brokerHost;
    this.topic = topic;
    
    // Create instances
    this.ackPubSub = new KafkaPubSubAck(
      brokerHost,
      topic,
      "ack-consumer-group"
    );
    
    this.noAckPubSub = new KafkaPubSubNoAck(
      brokerHost,
      topic,
      "noack-consumer-group"
    );
  }

  async runComparison() {
    console.log("🔍 Starting PubSub Comparison Test");
    console.log("=====================================");

    try {
      // Test ACK PubSub
      console.log("\n📋 Testing ACK PubSub (Reliable Delivery)");
      console.log("-------------------------------------------");
      await this.testAckPubSub();

      // Wait a bit
      await this.sleep(2000);

      // Test NoACK PubSub
      console.log("\n📋 Testing NoACK PubSub (High Performance)");
      console.log("---------------------------------------------");
      await this.testNoAckPubSub();

      console.log("\n✅ Comparison completed!");
      
    } catch (error) {
      console.log("❌ Comparison failed:", error.message);
    } finally {
      await this.cleanup();
    }
  }

  async testAckPubSub() {
    const startTime = Date.now();
    
    // Add message handler
    this.ackPubSub.onMessage((message, value) => {
      console.log(`🎯 ACK Received: ${value}`);
    });

    // Connect
    await this.ackPubSub.connectProducer();
    await this.ackPubSub.connectConsumer();

    // Send messages
    const messages = [
      "ACK Message 1 - Reliable delivery",
      "ACK Message 2 - With acknowledgment",
      "ACK Message 3 - Guaranteed delivery"
    ];

    for (const message of messages) {
      const sendStart = Date.now();
      await this.ackPubSub.publish(message);
      const sendEnd = Date.now();
      console.log(`⏱️  ACK Send time: ${sendEnd - sendStart}ms`);
    }

    // Send batch
    const batchStart = Date.now();
    const batchMessages = [
      { content: "ACK Batch 1" },
      { content: "ACK Batch 2" },
      { content: "ACK Batch 3" }
    ];
    await this.ackPubSub.publishBatch(batchMessages);
    const batchEnd = Date.now();
    console.log(`⏱️  ACK Batch time: ${batchEnd - batchStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`⏱️  ACK Total time: ${totalTime}ms`);

    // Wait for messages to be processed
    await this.sleep(3000);
  }

  async testNoAckPubSub() {
    const startTime = Date.now();
    
    // Add message handler
    this.noAckPubSub.onMessage((message, value) => {
      console.log(`🎯 NoACK Received: ${value}`);
    });

    // Connect
    await this.noAckPubSub.connectProducer();
    await this.noAckPubSub.connectConsumer();

    // Send messages
    const messages = [
      "NoACK Message 1 - Fire and forget",
      "NoACK Message 2 - High speed",
      "NoACK Message 3 - Maximum throughput"
    ];

    for (const message of messages) {
      const sendStart = Date.now();
      await this.noAckPubSub.publish(message);
      const sendEnd = Date.now();
      console.log(`⏱️  NoACK Send time: ${sendEnd - sendStart}ms`);
    }

    // Send batch
    const batchStart = Date.now();
    const batchMessages = [
      { content: "NoACK Batch 1" },
      { content: "NoACK Batch 2" },
      { content: "NoACK Batch 3" }
    ];
    await this.noAckPubSub.publishBatch(batchMessages);
    const batchEnd = Date.now();
    console.log(`⏱️  NoACK Batch time: ${batchEnd - batchStart}ms`);

    // Send high volume stream
    const streamStart = Date.now();
    const highVolumeMessages = Array.from({ length: 20 }, (_, i) => 
      `High volume message ${i + 1}`
    );
    await this.noAckPubSub.publishStream(highVolumeMessages, 5);
    const streamEnd = Date.now();
    console.log(`⏱️  NoACK Stream time: ${streamEnd - streamStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`⏱️  NoACK Total time: ${totalTime}ms`);

    // Wait for messages to be processed
    await this.sleep(3000);
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up...");
    await Promise.all([
      this.ackPubSub.disconnect(),
      this.noAckPubSub.disconnect()
    ]);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Performance benchmark
async function runBenchmark() {
  console.log("🚀 Starting Performance Benchmark");
  console.log("==================================");

  const benchmark = new PubSubComparison(
    "167.71.217.60:29093",
    "benchmark-topic"
  );

  await benchmark.runComparison();
}

// Usage examples
function showUsageExamples() {
  console.log("\n📚 Usage Examples");
  console.log("=================");

  console.log("\n1. ACK PubSub (Reliable):");
  console.log("   const ackPubSub = new KafkaPubSubAck(broker, topic, groupId);");
  console.log("   await ackPubSub.connectProducer();");
  console.log("   await ackPubSub.connectConsumer();");
  console.log("   await ackPubSub.publish('Reliable message');");

  console.log("\n2. NoACK PubSub (High Performance):");
  console.log("   const noAckPubSub = new KafkaPubSubNoAck(broker, topic, groupId);");
  console.log("   await noAckPubSub.connectProducer();");
  console.log("   await noAckPubSub.connectConsumer();");
  console.log("   await noAckPubSub.publish('Fast message');");
  console.log("   await noAckPubSub.publishStream(messages, batchSize);");

  console.log("\n3. Key Differences:");
  console.log("   ACK: requireAcks: 1, reliable delivery, slower");
  console.log("   NoACK: requireAcks: 0, fire & forget, faster");
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--benchmark")) {
    await runBenchmark();
  } else if (args.includes("--help")) {
    showUsageExamples();
  } else {
    console.log("🔍 PubSub Comparison Tool");
    console.log("Usage:");
    console.log("  bun run pubsub-comparison.js --benchmark  # Run performance test");
    console.log("  bun run pubsub-comparison.js --help       # Show usage examples");
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PubSubComparison;
