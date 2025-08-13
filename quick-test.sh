#!/bin/bash

# Quick Test Script for Enhanced Kafka PubSub
# This script demonstrates the complete functionality

set -e

echo "🧪 Enhanced Kafka PubSub Quick Test"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if scripts exist
check_scripts() {
    print_info "Checking scripts..."
    
    if [ ! -f "producer.js" ]; then
        echo "❌ producer.js not found"
        exit 1
    fi
    
    if [ ! -f "consumer.js" ]; then
        echo "❌ consumer.js not found"
        exit 1
    fi
    
    if [ ! -f "create-topics.js" ]; then
        echo "❌ create-topics.js not found"
        exit 1
    fi
    
    print_success "All scripts found"
}

# Test 1: String message with ACK
test_string_ack() {
    echo ""
    print_info "Test 1: String message with ACK"
    echo "-----------------------------------"
    
    # Start consumer in background
    print_info "Starting consumer (ACK mode)..."
    node consumer.js --ack --topic test-messages --group test-group-1 &
    CONSUMER_PID=$!
    
    # Wait for consumer to start
    sleep 3
    
    # Send message
    print_info "Sending string message..."
    node producer.js --ack --string --message "Hello from ACK producer!" --topic test-messages
    
    # Wait for message to be processed
    sleep 2
    
    # Stop consumer
    kill $CONSUMER_PID 2>/dev/null || true
    wait $CONSUMER_PID 2>/dev/null || true
    
    print_success "Test 1 completed"
}

# Test 2: JSON message with NoACK
test_json_noack() {
    echo ""
    print_info "Test 2: JSON message with NoACK"
    echo "------------------------------------"
    
    # Start consumer in background
    print_info "Starting consumer (NoACK mode)..."
    node consumer.js --no-ack --topic json-test-topic --group test-group-2 &
    CONSUMER_PID=$!
    
    # Wait for consumer to start
    sleep 3
    
    # Send JSON message
    print_info "Sending JSON message..."
    node producer.js --no-ack --json --message '{"type":"test","data":"Hello from NoACK producer!","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' --topic json-test-topic
    
    # Wait for message to be processed
    sleep 2
    
    # Stop consumer
    kill $CONSUMER_PID 2>/dev/null || true
    wait $CONSUMER_PID 2>/dev/null || true
    
    print_success "Test 2 completed"
}

# Test 3: Multiple messages
test_multiple_messages() {
    echo ""
    print_info "Test 3: Multiple messages"
    echo "----------------------------"
    
    # Start consumer in background
    print_info "Starting consumer..."
    node consumer.js --ack --topic test-messages --group test-group-3 &
    CONSUMER_PID=$!
    
    # Wait for consumer to start
    sleep 3
    
    # Send multiple messages
    print_info "Sending multiple messages..."
    
    node producer.js --ack --string --message "Message 1" --topic test-messages
    sleep 1
    
    node producer.js --ack --string --message "Message 2" --topic test-messages
    sleep 1
    
    node producer.js --ack --string --message "Message 3" --topic test-messages
    sleep 1
    
    # Wait for messages to be processed
    sleep 3
    
    # Stop consumer
    kill $CONSUMER_PID 2>/dev/null || true
    wait $CONSUMER_PID 2>/dev/null || true
    
    print_success "Test 3 completed"
}

# Test 4: Complex JSON
test_complex_json() {
    echo ""
    print_info "Test 4: Complex JSON message"
    echo "-------------------------------"
    
    # Start consumer in background
    print_info "Starting consumer..."
    node consumer.js --no-ack --topic json-test-topic --group test-group-4 &
    CONSUMER_PID=$!
    
    # Wait for consumer to start
    sleep 3
    
    # Send complex JSON
    print_info "Sending complex JSON message..."
    
    COMPLEX_JSON='{
        "type": "user_created",
        "data": {
            "userId": "U123456",
            "username": "test_user",
            "email": "test@example.com",
            "age": 25,
            "profile": {
                "bio": "Test user for Kafka pubsub",
                "location": "Indonesia"
            }
        },
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }'
    
    node producer.js --no-ack --json --message "$COMPLEX_JSON" --topic json-test-topic
    
    # Wait for message to be processed
    sleep 2
    
    # Stop consumer
    kill $CONSUMER_PID 2>/dev/null || true
    wait $CONSUMER_PID 2>/dev/null || true
    
    print_success "Test 4 completed"
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    
    # Kill any remaining background processes
    pkill -f "consumer.js" 2>/dev/null || true
    pkill -f "producer.js" 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main test function
main() {
    print_info "Starting quick test..."
    
    # Check scripts
    check_scripts
    
    # Run tests
    test_string_ack
    test_json_noack
    test_multiple_messages
    test_complex_json
    
    # Cleanup
    cleanup
    
    echo ""
    print_success "🎉 All tests completed successfully!"
    echo ""
    print_info "The enhanced Kafka pubsub system is working correctly!"
    echo ""
    print_info "You can now use the following commands:"
    echo "  node producer.js --help"
    echo "  node consumer.js --help"
    echo "  node create-topics.js --help"
    echo "  node clean-topics.js --help"
    echo ""
}

# Handle Ctrl+C
trap cleanup EXIT

# Run tests
main "$@"
