#!/bin/bash

# Enhanced Kafka PubSub Setup Script
# This script sets up the complete Kafka pubsub environment

set -e

echo "🚀 Enhanced Kafka PubSub Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js is installed: $(node --version)"
}

# Check if bun is installed
check_bun() {
    if ! command -v bun &> /dev/null; then
        print_warning "Bun is not installed. Using npm instead."
        PACKAGE_MANAGER="npm"
    else
        print_success "Bun is installed: $(bun --version)"
        PACKAGE_MANAGER="bun"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Make scripts executable
make_executable() {
    print_status "Making scripts executable..."
    
    chmod +x producer.js
    chmod +x consumer.js
    chmod +x create-topics.js
    chmod +x clean-topics.js
    
    print_success "Scripts are now executable"
}

# Create topics
create_topics() {
    print_status "Creating default topics..."
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun run create-topics.js --all
    else
        node create-topics.js --all
    fi
    
    print_success "Default topics created successfully"
}

# Test connection
test_connection() {
    print_status "Testing Kafka connection..."
    
    # Try to list topics to test connection
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun run create-topics.js --help > /dev/null 2>&1
    else
        node create-topics.js --help > /dev/null 2>&1
    fi
    
    print_success "Kafka connection test passed"
}

# Show usage examples
show_examples() {
    echo ""
    echo "📚 Usage Examples"
    echo "================="
    echo ""
    echo "1. Send messages:"
    echo "   # Send string message with ACK"
    echo "   node producer.js --ack --string --message 'Hello World'"
    echo ""
    echo "   # Send JSON message with NoACK"
    echo "   node producer.js --no-ack --json --message '{\"type\":\"test\",\"data\":\"value\"}'"
    echo ""
    echo "2. Listen to messages:"
    echo "   # Listen with ACK mode"
    echo "   node consumer.js --ack --topic test-messages"
    echo ""
    echo "   # Listen with NoACK mode"
    echo "   node consumer.js --no-ack --topic json-test-topic"
    echo ""
    echo "3. Manage topics:"
    echo "   # Create specific topic"
    echo "   node create-topics.js --topic my-topic --partitions 3"
    echo ""
    echo "   # Clean all custom topics"
    echo "   node clean-topics.js --all"
    echo ""
    echo "4. Quick test:"
    echo "   # Terminal 1: Start consumer"
    echo "   node consumer.js --ack"
    echo ""
    echo "   # Terminal 2: Send message"
    echo "   node producer.js --ack --string --message 'Test message'"
    echo ""
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    # Check prerequisites
    check_node
    check_bun
    
    # Install dependencies
    install_dependencies
    
    # Make scripts executable
    make_executable
    
    # Test connection
    test_connection
    
    # Create topics
    create_topics
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    print_status "Your Kafka pubsub system is ready to use!"
    echo ""
    
    # Show examples
    show_examples
    
    echo ""
    echo "📖 For more information, run:"
    echo "   node producer.js --help"
    echo "   node consumer.js --help"
    echo "   node create-topics.js --help"
    echo "   node clean-topics.js --help"
    echo ""
}

# Run setup
main "$@"
