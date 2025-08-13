# Kafka PubSub Systems - Enhanced Version

This project provides two enhanced Kafka PubSub implementations with different acknowledgment strategies for various use cases.

## 📋 Overview

### 🎯 ACK PubSub (`kafka-pubsub-ack.js`)
- **Reliable delivery** with acknowledgment
- **Guaranteed message delivery** 
- **Slower but safer** for critical messages
- **Best for**: Financial transactions, order processing, critical notifications

### ⚡ NoACK PubSub (`kafka-pubsub-noack.js`)
- **High-performance** fire-and-forget delivery
- **Maximum throughput** and speed
- **Faster but no delivery guarantee**
- **Best for**: Logging, metrics, real-time analytics, high-volume data

## 🚀 Features

### Common Features
- ✅ **Clean, organized code structure**
- ✅ **Comprehensive error handling**
- ✅ **Detailed logging and monitoring**
- ✅ **Batch message support**
- ✅ **Message handlers and callbacks**
- ✅ **Graceful shutdown handling**
- ✅ **Connection state management**

### ACK PubSub Features
- 🔒 **Reliable delivery** with `requireAcks: 1`
- ⏱️ **Configurable acknowledgment timeout**
- 📊 **Delivery confirmation logging**
- 🛡️ **Error recovery mechanisms**

### NoACK PubSub Features
- 🚀 **High-volume streaming** with `publishStream()`
- ⚡ **Fire-and-forget** with `requireAcks: 0`
- 📈 **Batch processing** for maximum throughput
- 🎯 **Performance optimization** methods

## 📦 Installation

```bash
# Install dependencies
bun install

# Create topics first
bun run kafka-create-topics.js
```

## 🔧 Usage

### Basic Usage - ACK PubSub

```javascript
const KafkaPubSubAck = require('./kafka-pubsub-ack');

const pubsub = new KafkaPubSubAck(
  '167.71.217.60:29093',
  'test-messages',
  'ack-consumer-group'
);

// Add message handler
pubsub.onMessage((message, value) => {
  console.log('Received:', value);
});

// Connect and use
await pubsub.connectProducer();
await pubsub.connectConsumer();

// Send reliable messages
await pubsub.publish('Critical message');
await pubsub.publishBatch([
  { content: 'Batch message 1' },
  { content: 'Batch message 2' }
]);
```

### Basic Usage - NoACK PubSub

```javascript
const KafkaPubSubNoAck = require('./kafka-pubsub-noack');

const pubsub = new KafkaPubSubNoAck(
  '167.71.217.60:29093',
  'test-messages',
  'noack-consumer-group'
);

// Add message handler
pubsub.onMessage((message, value) => {
  console.log('Received:', value);
});

// Connect and use
await pubsub.connectProducer();
await pubsub.connectConsumer();

// Send high-performance messages
await pubsub.publish('Fast message');
await pubsub.publishStream(['msg1', 'msg2', 'msg3'], 10);
```

## 🏃‍♂️ Running the Examples

### Run ACK PubSub
```bash
bun run kafka-pubsub-ack.js
```

### Run NoACK PubSub
```bash
bun run kafka-pubsub-noack.js
```

### Run Performance Comparison
```bash
bun run pubsub-comparison.js --benchmark
```

### Show Usage Examples
```bash
bun run pubsub-comparison.js --help
```

## 📊 Performance Comparison

| Feature | ACK PubSub | NoACK PubSub |
|---------|------------|--------------|
| **Delivery Guarantee** | ✅ Guaranteed | ❌ Best effort |
| **Speed** | 🐌 Slower | ⚡ Faster |
| **Throughput** | 📉 Lower | 📈 Higher |
| **Use Case** | Critical data | High volume |
| **Acknowledgment** | `requireAcks: 1` | `requireAcks: 0` |
| **Timeout** | 5000ms | 1000ms |

## 🔧 Configuration Options

### ACK PubSub Options
```javascript
const options = {
  // Connection
  connectTimeout: 10000,
  requestTimeout: 30000,
  
  // Producer (with ACK)
  requireAcks: 1,        // Wait for leader acknowledgment
  ackTimeoutMs: 5000,    // 5 second timeout
  
  // Consumer
  autoCommit: true,
  autoCommitIntervalMs: 5000,
  fetchMaxWaitMs: 1000,
  fetchMinBytes: 1,
  fetchMaxBytes: 1024 * 1024,
  fromOffset: "latest"
};
```

### NoACK PubSub Options
```javascript
const options = {
  // Connection
  connectTimeout: 10000,
  requestTimeout: 30000,
  
  // Producer (no ACK)
  requireAcks: 0,        // Fire and forget
  ackTimeoutMs: 1000,    // 1 second timeout
  
  // Consumer
  autoCommit: true,
  autoCommitIntervalMs: 5000,
  fetchMaxWaitMs: 1000,
  fetchMinBytes: 1,
  fetchMaxBytes: 1024 * 1024,
  fromOffset: "latest"
};
```

## 📝 API Reference

### Producer Methods

#### `connectProducer()`
Connect the producer to Kafka.

#### `publish(message, key?)`
Publish a single message.
- `message`: String message to send
- `key`: Optional message key

#### `publishBatch(messages)`
Publish multiple messages in batch.
- `messages`: Array of `{content: string}` objects

#### `publishStream(messages, batchSize)` (NoACK only)
Publish high-volume message stream.
- `messages`: Array of string messages
- `batchSize`: Number of messages per batch (default: 100)

#### `disconnectProducer()`
Disconnect the producer.

### Consumer Methods

#### `connectConsumer()`
Connect the consumer to Kafka.

#### `onMessage(handler)`
Register a message handler function.
- `handler(message, value)`: Function called for each message

#### `disconnectConsumer()`
Disconnect the consumer.

### Utility Methods

#### `isProducerReady()`
Check if producer is connected.

#### `isConsumerReady()`
Check if consumer is connected.

#### `disconnect()`
Disconnect both producer and consumer.

## 🎯 Use Case Examples

### ACK PubSub - Critical Business Logic
```javascript
// Order processing system
const orderPubSub = new KafkaPubSubAck(broker, 'orders', 'order-processor');

orderPubSub.onMessage(async (message, orderData) => {
  try {
    // Process critical order
    await processOrder(orderData);
    console.log('Order processed successfully');
  } catch (error) {
    console.error('Order processing failed:', error);
    // Retry logic here
  }
});
```

### NoACK PubSub - High-Volume Analytics
```javascript
// Analytics logging system
const analyticsPubSub = new KafkaPubSubNoAck(broker, 'analytics', 'analytics-processor');

analyticsPubSub.onMessage((message, eventData) => {
  // Process analytics event (non-critical)
  logAnalyticsEvent(eventData);
});

// Send high-volume events
const events = generateAnalyticsEvents(10000);
await analyticsPubSub.publishStream(events, 100);
```

## 🛠️ Error Handling

Both systems include comprehensive error handling:

- **Connection errors**: Automatic retry and logging
- **Message errors**: Detailed error messages with context
- **Handler errors**: Isolated error handling per message
- **Graceful shutdown**: Proper cleanup on exit

## 📈 Monitoring

### Logging Features
- 🔌 Connection status
- 📤 Message publishing status
- 📨 Message receiving status
- ⏱️ Performance timing
- ❌ Error details
- 🎯 Handler execution

### Performance Metrics
- Message send time
- Batch processing time
- Stream processing time
- Total operation time

## 🔒 Security Considerations

- Use secure Kafka configuration
- Implement proper authentication
- Monitor message content
- Handle sensitive data appropriately

## 🚀 Best Practices

### For ACK PubSub
- Use for critical business operations
- Implement retry logic for failed messages
- Monitor acknowledgment timeouts
- Handle delivery failures gracefully

### For NoACK PubSub
- Use for non-critical, high-volume data
- Implement monitoring for message loss
- Use appropriate batch sizes
- Consider message ordering requirements

## 📞 Support

For issues or questions:
1. Check the error logs
2. Verify Kafka connectivity
3. Review configuration options
4. Test with simple examples first

---

**Happy messaging! 🚀**
