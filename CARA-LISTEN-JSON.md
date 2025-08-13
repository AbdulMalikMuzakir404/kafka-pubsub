# Cara Listen Message dari json-test-topic

Dokumentasi lengkap tentang cara mendengarkan (listen) pesan JSON dari topic `json-test-topic` menggunakan sistem pubsub yang telah dibuat.

## 📋 Daftar Isi

1. [Prerequisites](#prerequisites)
2. [Cara Menggunakan Listener](#cara-menggunakan-listener)
3. [Mode Listening](#mode-listening)
4. [Contoh Penggunaan](#contoh-penggunaan)
5. [Format Output](#format-output)
6. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Pastikan Anda telah:
- ✅ Menginstall dependencies: `bun install`
- ✅ Membuat topic: `bun run kafka-create-topics.js`
- ✅ Kafka server berjalan di `167.71.217.60:29093`

## 🎧 Cara Menggunakan Listener

### 1. Basic Usage

```bash
# Listen dengan ACK mode (reliable delivery)
bun run listen-json-topic.js ack

# Listen dengan NoACK mode (high performance)
bun run listen-json-topic.js noack

# Lihat help
bun run listen-json-topic.js --help
```

### 2. Script Files

- **`listen-json-topic.js`** - Script utama untuk listening
- **`send-json-message.js`** - Script untuk mengirim pesan test

## 🔄 Mode Listening

### ACK Mode (Reliable)
```bash
bun run listen-json-topic.js ack
```
- ✅ **Guaranteed delivery** - Pesan dijamin sampai
- ⏱️ **Slower** - Menunggu acknowledgment
- 🛡️ **Reliable** - Cocok untuk data penting

### NoACK Mode (High Performance)
```bash
bun run listen-json-topic.js noack
```
- ⚡ **Fast** - Fire and forget
- 📈 **High throughput** - Cocok untuk data volume tinggi
- 🎯 **Best effort** - Tidak ada jaminan delivery

## 📝 Contoh Penggunaan

### 1. Listen Real-time Messages

```bash
# Terminal 1: Start listener
bun run listen-json-topic.js ack

# Terminal 2: Send messages
bun run send-json-message.js
```

### 2. Listen dengan Custom Handler

```javascript
const KafkaPubSubAck = require('./kafka-pubsub-ack');

const pubsub = new KafkaPubSubAck(
  "167.71.217.60:29093",
  "json-test-topic",
  "my-custom-group"
);

// Custom message handler
pubsub.onMessage((message, value) => {
  const jsonData = JSON.parse(value);
  
  // Handle berdasarkan type
  switch (jsonData.type) {
    case 'user_created':
      console.log('New user:', jsonData.data.username);
      break;
    case 'order_placed':
      console.log('New order:', jsonData.data.orderId);
      break;
    // ... handle lainnya
  }
});

await pubsub.connectConsumer();
```

## 📊 Format Output

Listener akan menampilkan output yang terformat berdasarkan tipe pesan:

### User Created Event
```
📨 Received user_created event:
  Timestamp: 2025-08-13T08:45:43.282Z
  👤 User: jane_doe (jane@example.com)
  ID: U123456, Age: 28
  ---
```

### Order Placed Event
```
📨 Received order_placed event:
  Timestamp: 2025-08-13T08:45:43.307Z
  🛒 Order: ORD-2024-002
  Customer: CUST-456
  Total: $819.98
  Items: 2 products
  ---
```

### System Alert Event
```
📨 Received system_alert event:
  Timestamp: 2025-08-13T08:45:43.338Z
  ⚠️  Alert: ERROR
  Message: Database connection timeout
  Server: SRV-003
  CPU: 95.2%, Memory: 88.7%
  ---
```

### Page View Event
```
📨 Received page_view event:
  Timestamp: 2025-08-13T08:45:43.350Z
  🌐 Page: /products/smartphone
  User: USER-789
  Session: SESS-123
  ---
```

## 🎯 Tipe Pesan yang Didukung

Listener dapat menangani berbagai tipe pesan JSON:

| Tipe | Deskripsi | Contoh Data |
|------|-----------|-------------|
| `user_created` | User baru dibuat | username, email, age |
| `order_placed` | Order baru dibuat | orderId, items, total |
| `system_alert` | Alert sistem | level, message, serverId |
| `page_view` | User melihat halaman | pageId, userId, sessionId |
| `user_action` | Aksi user | action, elementId, pageUrl |
| `application_log` | Log aplikasi | level, message, duration |
| `system_metrics` | Metrics sistem | cpuUsage, memoryUsage |
| `notification_sent` | Notifikasi terkirim | notificationType, subject |
| `cache_updated` | Cache diupdate | cacheKey, operation, size |
| `database_query` | Query database | query, duration, table |

## 🛠️ Troubleshooting

### 1. Connection Error
```
❌ Error: Connection failed
```
**Solusi:**
- Pastikan Kafka server berjalan
- Cek koneksi ke `167.71.217.60:29093`
- Restart Kafka jika perlu

### 2. Topic Not Found
```
❌ Error: Topic json-test-topic not found
```
**Solusi:**
```bash
bun run kafka-create-topics.js
```

### 3. JSON Parse Error
```
❌ Error parsing JSON: Unexpected token
```
**Solusi:**
- Pastikan pesan dalam format JSON valid
- Cek struktur data yang dikirim

### 4. No Messages Received
```
📡 Listening for messages...
```
**Solusi:**
- Kirim pesan test: `bun run send-json-message.js`
- Cek consumer group offset
- Restart listener jika perlu

## 🔧 Advanced Usage

### 1. Multiple Listeners
```bash
# Terminal 1
bun run listen-json-topic.js ack

# Terminal 2  
bun run listen-json-topic.js noack

# Terminal 3
bun run send-json-message.js
```

### 2. Custom Consumer Group
```javascript
const pubsub = new KafkaPubSubAck(
  "167.71.217.60:29093",
  "json-test-topic",
  "my-custom-consumer-group" // Custom group name
);
```

### 3. Filter Messages
```javascript
pubsub.onMessage((message, value) => {
  const jsonData = JSON.parse(value);
  
  // Filter hanya user events
  if (jsonData.type.startsWith('user_')) {
    console.log('User event:', jsonData);
  }
  
  // Filter berdasarkan level
  if (jsonData.type === 'system_alert' && jsonData.data.level === 'error') {
    console.log('Critical alert:', jsonData);
  }
});
```

## 📈 Monitoring

### 1. Check Message Count
```bash
# Lihat berapa pesan yang sudah diproses
# Output akan menampilkan offset yang bertambah
```

### 2. Performance Monitoring
- **ACK Mode**: Lebih lambat tapi reliable
- **NoACK Mode**: Lebih cepat tapi tidak ada jaminan

### 3. Error Monitoring
- Listener akan menampilkan error parsing JSON
- Connection errors akan ditampilkan
- Graceful shutdown dengan Ctrl+C

## 🚀 Best Practices

1. **Gunakan ACK mode** untuk data penting (orders, payments)
2. **Gunakan NoACK mode** untuk analytics dan logs
3. **Implement error handling** untuk JSON parsing
4. **Monitor consumer lag** untuk performa
5. **Gunakan custom consumer groups** untuk isolasi
6. **Restart listener** jika ada masalah koneksi

---

**Happy listening! 🎧**
