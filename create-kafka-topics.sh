#!/bin/bash

# Kafka Topic Creator Script
# This script creates topics for the application

set -e

# Configuration
KAFKA_BOOTSTRAP_SERVER="167.71.217.60:29093"

# Topic configurations (using simple arrays for compatibility)
TOPICS=(
    "test-messages:1:1:Topic untuk testing producer dan consumer"
    "user-events:3:1:Topic untuk user events"
    "system-logs:2:1:Topic untuk system logs"
    "notifications:1:1:Topic untuk notifications"
)

echo "🔌 Connecting to Kafka at $KAFKA_BOOTSTRAP_SERVER"

# Check if kafka-topics command is available
if ! command -v kafka-topics &> /dev/null; then
    echo "❌ kafka-topics command not found. Please install Kafka CLI tools."
    echo "   You can run this script inside the Kafka container instead:"
    echo "   docker exec -it kafka-pubsub-kafka-1 bash"
    exit 1
fi

# Function to check if topic exists
topic_exists() {
    local topic=$1
    kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP_SERVER --list | grep -q "^$topic$"
}

# Function to create topic
create_topic() {
    local topic=$1
    local partitions=$2
    local replication_factor=$3
    local description=$4
    
    echo "🔨 Creating topic: $topic"
    echo "   Partitions: $partitions"
    echo "   Replication Factor: $replication_factor"
    echo "   Description: $description"
    
    kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP_SERVER \
                 --create \
                 --topic "$topic" \
                 --partitions "$partitions" \
                 --replication-factor "$replication_factor" \
                 --if-not-exists
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully created topic: $topic"
        return 0
    else
        echo "❌ Failed to create topic: $topic"
        return 1
    fi
}

echo "📋 Creating topics for the application..."

created_count=0
skipped_count=0
failed_count=0

for topic_config in "${TOPICS[@]}"; do
    IFS=':' read -r topic partitions replication_factor description <<< "$topic_config"
    
    if topic_exists "$topic"; then
        echo "⏭️  Topic '$topic' already exists, skipping..."
        ((skipped_count++))
        continue
    fi
    
    if create_topic "$topic" "$partitions" "$replication_factor" "$description"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
done

echo ""
echo "📊 Topic Creation Summary:"
echo "✅ Successfully created: $created_count topics"
echo "⏭️  Skipped (already exist): $skipped_count topics"
echo "❌ Failed to create: $failed_count topics"

if [ $failed_count -eq 0 ]; then
    echo "🎉 All topics created successfully!"
    
    echo ""
    echo "📋 Current topics:"
    kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP_SERVER --list
else
    exit 1
fi
