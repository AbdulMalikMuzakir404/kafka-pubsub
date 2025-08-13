# Kafka PubSub - Production Ready

A production-ready Kafka Producer and Consumer implementation using Node.js and kafka-node.

## 🚀 Features

- ✅ **Production-ready** Kafka Producer and Consumer classes
- ✅ **Error handling** and retry mechanisms
- ✅ **Batch message** support
- ✅ **JSON message** support with automatic parsing
- ✅ **Custom message handlers** for consumers
- ✅ **Graceful shutdown** handling
- ✅ **Docker Compose** setup with tunneling
- ✅ **One-click deployment** script
- ✅ **Comprehensive logging** and error handling

## 📋 Prerequisites

- Node.js >= 16.0.0 or Bun >= 1.0.0
- Docker and Docker Compose
- Access to VPS/server

## 🛠️ Quick Deployment

### **1. Upload files to VPS:**

```bash
# Upload these files to your VPS
scp docker-compose.yml setup.sh user@your-server-ip:/path/to/kafka/
```

### **2. Run setup script:**

```bash
# On VPS
chmod +x setup.sh
./setup.sh
```

### **3. Test from your laptop:**

```bash
# Test connection
bun run test:connection

# Run example (producer + consumer)
bun run example-client.js

# Or run separately
bun run start:consumer  # Terminal 1
bun run start:producer  # Terminal 2
```

## 📖 Usage

### Producer

```javascript
const KafkaProducer = require("./kafka-producer");

async function example() {
  const producer = new KafkaProducer("your-server-ip:29093", "test-messages");

  try {
    await producer.connect();

    // Send single message
    await producer.sendMessage("Hello World!");

    // Send message with key
    await producer.sendMessage("Hello User!", "user-123");

    // Send JSON message
    await producer.sendMessage({
      id: 1,
      message: "JSON message",
      timestamp: new Date().toISOString()
    }, "json-key");

    // Send batch messages
    const batchMessages = [
      { content: "Message 1", key: "key1" },
      { content: "Message 2", key: "key2" },
      { content: { data: "JSON message", timestamp: Date.now() }, key: "key3" }
    ];
    await producer.sendBatch(batchMessages);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await producer.disconnect();
  }
}
```

### Consumer

```javascript
const KafkaConsumer = require("./kafka-consumer");

async function example() {
  const consumer = new KafkaConsumer(
    "your-server-ip:29093",
    "test-messages",
    "my-group"
  );

  // Add custom message handler
  consumer.onMessage((message, parsedData) => {
    console.log("Received:", message.value.toString());
    
    if (parsedData) {
      // Handle JSON messages
      console.log("Parsed data:", parsedData);
    }
  });

  try {
    await consumer.connect();
    console.log("Consumer is running...");

    // Keep running
    process.on("SIGINT", async () => {
      await consumer.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

## 📝 Available Scripts

- `bun run start:producer` - Start the production producer
- `bun run start:consumer` - Start the production consumer
- `bun run test:connection` - Test Kafka connection
- `bun run example-client.js` - Run complete example (producer + consumer)
- `bun run dev` - Start producer in watch mode

## 🔧 Configuration

### Environment Variables

You can set these environment variables:

```bash
KAFKA_BROKER_HOST=your-server-ip:29093
KAFKA_TOPIC=test-messages
KAFKA_CONSUMER_GROUP=my-group
```

### Producer Options

```javascript
const producer = new KafkaProducer(brokerHost, topic, {
  connectTimeout: 10000,    // Connection timeout in ms
  requestTimeout: 30000,    // Request timeout in ms
  requireAcks: 1,          // Number of acknowledgments
  ackTimeoutMs: 1000,      // Acknowledgment timeout
});
```

### Consumer Options

```javascript
const consumer = new KafkaConsumer(brokerHost, topic, groupId, {
  connectTimeout: 10000,        // Connection timeout in ms
  requestTimeout: 30000,        // Request timeout in ms
  autoCommit: true,            // Auto commit offsets
  autoCommitIntervalMs: 5000,  // Commit interval
  fromOffset: "latest",        // Start from latest messages
  fetchMaxWaitMs: 1000,        // Max wait for messages
  fetchMinBytes: 1,            // Min bytes to fetch
  fetchMaxBytes: 1024 * 1024,  // Max bytes to fetch
});
```

## 🐳 Docker Services

- **Zookeeper**: Port 2181 (internal)
- **Kafka**: Port 9093 (internal), 29093 (external via tunnel)
- **Connect**: Port 8083 (internal), 8084 (external)
- **Kafka UI**: Port 8080 (internal), 8081 (external)

## 🐛 Troubleshooting

### Common Issues

1. **Connection Timeout:**
   - Check if Kafka broker is running
   - Verify IP address and port (29093)
   - Check firewall settings

2. **Producer Timeout:**
   - Ensure tunnel is working
   - Check network connectivity
   - Verify Docker containers are healthy

3. **Consumer Not Receiving Messages:**
   - Verify topic exists
   - Check consumer group configuration
   - Ensure producer is sending to correct topic

### Debug Commands

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Test tunnel
nc -zv your-server-ip 29093

# Check Kafka topics
docker exec $(docker compose ps -q kafka) /opt/bitnami/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9093
```

## 📊 Monitoring

Access Kafka UI at: `http://your-server-ip:8081`

Features:
- Topic management
- Message browsing
- Consumer group monitoring
- Real-time metrics

## 🔒 Security

For production use, consider:

- Enable SSL/TLS encryption
- Add authentication (SASL)
- Configure ACLs
- Use secure passwords

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Kafka documentation
