# Enhanced Kafka PubSub System

Sistem Kafka PubSub yang telah ditingkatkan dengan flag command line dan script yang mudah digunakan.

## 🚀 Fitur Utama

- ✅ **Dual Mode**: ACK (reliable) dan NoACK (high performance)
- ✅ **Dual Format**: JSON dan String messages
- ✅ **Command Line Flags**: Mudah digunakan dengan flag
- ✅ **Auto-detection**: Consumer otomatis mendeteksi format JSON/String
- ✅ **Shell Scripts**: Setup dan test otomatis
- ✅ **Comprehensive**: Producer, Consumer, Topic Management

## 📦 File yang Tersedia

### Core Scripts
- **`producer.js`** - Enhanced producer dengan flag
- **`consumer.js`** - Enhanced consumer dengan auto-detection
- **`create-topics.js`** - Topic creation dengan flag
- **`clean-topics.js`** - Topic cleanup dengan flag

### Shell Scripts
- **`setup.sh`** - Setup otomatis sistem
- **`quick-test.sh`** - Test cepat semua fitur

## 🛠️ Setup

### 1. Setup Otomatis
```bash
# Setup lengkap dengan satu command
./setup.sh
```

### 2. Setup Manual
```bash
# Install dependencies
bun install

# Buat topics
node create-topics.js --all

# Test sistem
./quick-test.sh
```

## 📤 Producer Usage

### Basic Commands
```bash
# Send string message dengan ACK
node producer.js --ack --string --message "Hello World"

# Send JSON message dengan NoACK
node producer.js --no-ack --json --message '{"type":"test","data":"value"}'

# Send ke topic tertentu
node producer.js --ack --json --topic user-events --message '{"userId":123}'
```

### Available Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--ack` | Use ACK mode (reliable) | `--ack` |
| `--no-ack` | Use NoACK mode (fast) | `--no-ack` |
| `--json` | Send JSON message | `--json` |
| `--string` | Send string message | `--string` |
| `--topic` | Specify topic name | `--topic my-topic` |
| `--message` | Message content | `--message "Hello"` |
| `--help` | Show help | `--help` |

### Examples
```bash
# Quick examples
node producer.js --ack --string
node producer.js --no-ack --json

# Complex examples
node producer.js --ack --json --topic orders --message '{"orderId":"123","amount":100}'
node producer.js --no-ack --string --topic logs --message "System started"
```

## 🎧 Consumer Usage

### Basic Commands
```bash
# Listen dengan ACK mode
node consumer.js --ack --topic test-messages

# Listen dengan NoACK mode
node consumer.js --no-ack --topic user-events --group user-processor

# Listen ke topic tertentu
node consumer.js --ack --topic json-test-topic --group my-group
```

### Available Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--ack` | Use ACK mode (reliable) | `--ack` |
| `--no-ack` | Use NoACK mode (fast) | `--no-ack` |
| `--topic` | Topic name | `--topic my-topic` |
| `--group` | Consumer group | `--group my-group` |
| `--help` | Show help | `--help` |

### Auto-detection Features
Consumer akan otomatis:
- ✅ **Detect JSON format** dan parse dengan rapi
- ✅ **Handle structured JSON** dengan type field
- ✅ **Format output** berdasarkan tipe pesan
- ✅ **Fallback ke string** jika bukan JSON valid

## 🔨 Topic Management

### Create Topics
```bash
# Create semua default topics
node create-topics.js --all

# Create topic tertentu
node create-topics.js --topic my-topic --partitions 3

# Create dengan custom config
node create-topics.js --topic high-volume --partitions 5 --replication 1
```

### Clean Topics
```bash
# Clean semua custom topics
node clean-topics.js --all

# Clean topic tertentu
node clean-topics.js --topic my-topic

# Force clean tanpa konfirmasi
node clean-topics.js --all --force
```

## 🧪 Quick Test

### Test Otomatis
```bash
# Test semua fitur
./quick-test.sh
```

### Test Manual
```bash
# Terminal 1: Start consumer
node consumer.js --ack --topic test-messages

# Terminal 2: Send messages
node producer.js --ack --string --message "Test message"
node producer.js --no-ack --json --message '{"type":"test","data":"value"}'
```

## 📊 Output Examples

### String Message
```
📨 [2025-08-13 15:30:45] Received message:
  Topic: test-messages
  Partition: 0
  Offset: 5
  Key: No key
  Format: String
  Value: Hello World
  ---
```

### JSON Message
```
📨 [2025-08-13 15:30:46] Received message:
  Topic: json-test-topic
  Partition: 0
  Offset: 10
  Key: No key
  Type: user_created
  Format: JSON (Structured)
  👤 User: john_doe (john@example.com)
  ID: U123456, Age: 30
  ---
```

## 🎯 Use Cases

### ACK Mode (Reliable)
```bash
# Orders dan payments
node producer.js --ack --json --topic orders --message '{"orderId":"123","amount":100}'

# User registration
node producer.js --ack --json --topic users --message '{"userId":"456","email":"user@example.com"}'
```

### NoACK Mode (High Performance)
```bash
# Analytics events
node producer.js --no-ack --json --topic analytics --message '{"event":"page_view","userId":"123"}'

# System logs
node producer.js --no-ack --string --topic logs --message "System started at $(date)"
```

## 🔧 Advanced Usage

### Multiple Consumers
```bash
# Terminal 1
node consumer.js --ack --topic orders --group order-processor-1

# Terminal 2
node consumer.js --ack --topic orders --group order-processor-2

# Terminal 3
node producer.js --ack --json --topic orders --message '{"orderId":"123"}'
```

### Custom JSON Types
```bash
# Send custom JSON
node producer.js --no-ack --json --message '{
  "type": "custom_event",
  "data": {
    "eventId": "evt_123",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "metadata": {
      "source": "web",
      "version": "1.0"
    }
  }
}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Error**
   ```bash
   # Check Kafka server
   nc -zv 167.71.217.60 29093
   ```

2. **Topic Not Found**
   ```bash
   # Create topics
   node create-topics.js --all
   ```

3. **JSON Parse Error**
   ```bash
   # Validate JSON
   echo '{"test":"value"}' | jq .
   ```

4. **Permission Denied**
   ```bash
   # Make scripts executable
   chmod +x *.js *.sh
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=kafka* node consumer.js --ack
```

## 📈 Performance Tips

### For High Volume
- Use `--no-ack` flag untuk throughput tinggi
- Use multiple partitions untuk parallel processing
- Use batch processing untuk multiple messages

### For Critical Data
- Use `--ack` flag untuk guaranteed delivery
- Use single partition untuk ordered messages
- Implement retry logic di consumer

## 🔒 Security Considerations

- ✅ Validate JSON input sebelum send
- ✅ Use secure Kafka configuration
- ✅ Monitor message content
- ✅ Implement proper authentication

## 📚 Additional Resources

### Help Commands
```bash
node producer.js --help
node consumer.js --help
node create-topics.js --help
node clean-topics.js --help
```

### Configuration
- Kafka Broker: `167.71.217.60:29093`
- Default Topics: `test-messages`, `user-events`, `system-logs`, `notifications`, `json-test-topic`
- Default Consumer Groups: `default-consumer-group`

---

**Happy messaging! 🚀**
