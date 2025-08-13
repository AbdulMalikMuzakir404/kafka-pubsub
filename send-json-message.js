const KafkaPubSubNoAck = require("./kafka-pubsub-noack");

async function sendJsonMessages() {
  console.log("📤 Sending JSON messages to json-test-topic");
  console.log("=============================================");

  const pubsub = new KafkaPubSubNoAck(
    "167.71.217.60:29093",
    "json-test-topic",
    "json-sender-group"
  );

  try {
    await pubsub.connectProducer();
    console.log("✅ Connected to Kafka");

    // Test 1: User created event
    const userEvent = {
      type: "user_created",
      data: {
        userId: "U123456",
        username: "jane_doe",
        email: "jane@example.com",
        age: 28,
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(userEvent));
    console.log("✅ Sent user_created event");

    // Test 2: Order placed event
    const orderEvent = {
      type: "order_placed",
      data: {
        orderId: "ORD-2024-002",
        customerId: "CUST-456",
        items: [
          {
            productId: "PROD-3",
            name: "Smartphone",
            price: 799.99,
            quantity: 1,
          },
          { productId: "PROD-4", name: "Case", price: 19.99, quantity: 1 },
        ],
        totalAmount: 819.98,
        status: "confirmed",
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(orderEvent));
    console.log("✅ Sent order_placed event");

    // Test 3: System alert
    const alertEvent = {
      type: "system_alert",
      data: {
        level: "error",
        message: "Database connection timeout",
        serverId: "SRV-003",
        cpuUsage: 95.2,
        memoryUsage: 88.7,
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(alertEvent));
    console.log("✅ Sent system_alert event");

    // Test 4: Page view
    const pageViewEvent = {
      type: "page_view",
      data: {
        pageId: "/products/smartphone",
        userId: "USER-789",
        sessionId: "SESS-123",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        referrer: "https://facebook.com",
        timestamp: Date.now(),
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(pageViewEvent));
    console.log("✅ Sent page_view event");

    // Test 5: User action
    const userActionEvent = {
      type: "user_action",
      data: {
        actionId: "ACTION-999",
        userId: "USER-999",
        action: "purchase",
        elementId: "buy-button",
        pageUrl: "/checkout",
        sessionDuration: 1800,
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(userActionEvent));
    console.log("✅ Sent user_action event");

    // Test 6: Application log
    const logEvent = {
      type: "application_log",
      data: {
        level: "debug",
        message: "Payment processing completed",
        userId: "USER-999",
        ipAddress: "203.0.113.1",
        userAgent: "Mobile App v3.0.0",
        duration: 850,
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(logEvent));
    console.log("✅ Sent application_log event");

    // Test 7: System metrics
    const metricsEvent = {
      type: "system_metrics",
      data: {
        cpuUsage: 32.1,
        memoryUsage: 45.8,
        diskUsage: 67.3,
        networkIn: 2048,
        networkOut: 4096,
        activeConnections: 89,
        serverId: "SRV-004",
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(metricsEvent));
    console.log("✅ Sent system_metrics event");

    // Test 8: Notification
    const notificationEvent = {
      type: "notification_sent",
      data: {
        userId: "USER-999",
        notificationType: "push",
        subject: "Order confirmed",
        status: "delivered",
      },
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(JSON.stringify(notificationEvent));
    console.log("✅ Sent notification_sent event");

    console.log("\n🎉 All JSON messages sent successfully!");
    console.log("Now run the listener to see the messages:");
    console.log("  bun run listen-json-topic.js ack");
    console.log("  bun run listen-json-topic.js noack");
  } catch (error) {
    console.log("❌ Error:", error.message);
  } finally {
    await pubsub.disconnect();
    console.log("🔌 Disconnected from Kafka");
  }
}

// Run the sender
sendJsonMessages().catch(console.error);
