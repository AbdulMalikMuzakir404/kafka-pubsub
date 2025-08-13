#!/bin/bash

# Kafka Topic Cleaner Script
# This script deletes all custom topics while preserving default Kafka topics

set -e

# Configuration
KAFKA_BOOTSTRAP_SERVER="167.71.217.60:29093"
DEFAULT_TOPICS=(
    "__consumer_offsets"
    "__transaction_state"
    "connect-configs"
    "connect-offsets"
    "connect-status"
    "connect-status-5"
    "connect-configs-5"
    "connect-offsets-5"
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

# Function to delete topic
delete_topic() {
    local topic=$1
    echo "🗑️  Deleting topic: $topic"
    kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP_SERVER --delete --topic "$topic" --if-exists
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deleted topic: $topic"
        return 0
    else
        echo "❌ Failed to delete topic: $topic"
        return 1
    fi
}

# Get all topics
echo "📋 Fetching all topics..."
ALL_TOPICS=$(kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP_SERVER --list)

if [ -z "$ALL_TOPICS" ]; then
    echo "✅ No topics found"
    exit 0
fi

echo "📊 Found topics:"
echo "$ALL_TOPICS"

echo ""
echo "🔒 Default topics (will be preserved):"
printf '%s\n' "${DEFAULT_TOPICS[@]}"

# Filter out default topics
TOPICS_TO_DELETE=""
for topic in $ALL_TOPICS; do
    # Check if topic is in default topics list
    is_default=false
    for default_topic in "${DEFAULT_TOPICS[@]}"; do
        if [ "$topic" = "$default_topic" ]; then
            is_default=true
            break
        fi
    done
    
    if [ "$is_default" = false ]; then
        TOPICS_TO_DELETE="$TOPICS_TO_DELETE $topic"
    fi
done

# Remove leading space
TOPICS_TO_DELETE=$(echo "$TOPICS_TO_DELETE" | sed 's/^ *//')

if [ -z "$TOPICS_TO_DELETE" ]; then
    echo "✅ No custom topics found to delete"
    exit 0
fi

echo ""
echo "🗑️  Topics to delete:"
echo "$TOPICS_TO_DELETE"

# Confirm deletion
echo ""
read -p "⚠️  Are you sure you want to delete these topics? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

# Delete topics
echo ""
echo "🚀 Starting topic deletion..."
deleted_count=0
failed_count=0

for topic in $TOPICS_TO_DELETE; do
    if delete_topic "$topic"; then
        ((deleted_count++))
    else
        ((failed_count++))
    fi
done

echo ""
echo "📊 Cleanup Summary:"
echo "✅ Successfully deleted: $deleted_count topics"
echo "❌ Failed to delete: $failed_count topics"
echo "🔒 Preserved default topics: ${#DEFAULT_TOPICS[@]}"

if [ $failed_count -gt 0 ]; then
    exit 1
else
    echo "🎉 Topic cleanup completed successfully!"
fi
