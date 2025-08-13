#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Kafka Setup Script${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed (standalone or plugin)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create alias if using Docker Compose plugin
if ! command -v docker-compose &> /dev/null && docker compose version &> /dev/null; then
    print_status "Docker Compose plugin detected, creating alias..."
    echo "alias docker-compose='docker compose'" >> ~/.bashrc
    source ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
    # Set alias for current session
    alias docker-compose='docker compose'
fi

print_status "Docker and Docker Compose are installed"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
print_status "Server IP: $SERVER_IP"

# Create necessary directories
print_status "Creating directories..."
mkdir -p plugins jdbc

# Stop existing containers if any
print_status "Stopping existing containers..."
docker compose down 2>/dev/null || true

# Remove old containers and volumes (optional)
read -p "Do you want to remove old containers and volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Removing old containers and volumes..."
    docker compose down -v 2>/dev/null || true
    docker system prune -f
fi

# Pull latest images
print_status "Pulling Docker images..."
docker compose pull

# Start services
print_status "Starting Kafka services..."
docker compose up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check service status
print_status "Checking service status..."
docker compose ps

# Check if tunnel is working
print_status "Testing tunnel connection..."
if nc -z localhost 29093 2>/dev/null; then
    print_status "Tunnel is working! Port 29093 is accessible"
else
    print_warning "Tunnel test failed. Checking logs..."
    docker compose logs kafka-tunnel
fi

# Check Kafka UI
print_status "Kafka UI should be available at: http://$SERVER_IP:8081"

# Test Kafka connection
print_status "Testing Kafka connection..."
if docker exec $(docker compose ps -q kafka) kafka-topics --bootstrap-server localhost:9093 --list 2>/dev/null; then
    print_status "Kafka is working correctly!"
else
    print_warning "Kafka connection test failed. Checking logs..."
    docker compose logs kafka
fi

echo ""
echo -e "${BLUE}🎉 Setup completed!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}📋 Next steps:${NC}"
echo "1. Test connection from your laptop:"
echo "   nc -zv $SERVER_IP 29093"
echo ""
echo "2. Run consumer:"
echo "   bun run start:consumer"
echo ""
echo "3. Run producer:"
echo "   bun run start:producer"
echo ""
echo -e "${GREEN}📊 Monitoring:${NC}"
echo "• Kafka UI: http://$SERVER_IP:8081"
echo "• Connect API: http://$SERVER_IP:8084"
echo ""
echo -e "${GREEN}🔧 Useful commands:${NC}"
echo "• View logs: docker compose logs -f"
echo "• Stop services: docker compose down"
echo "• Restart services: docker compose restart"
echo "• Check status: docker compose ps"
echo ""
echo -e "${YELLOW}⚠️ Important:${NC}"
echo "• Make sure port 29093 is open in your firewall"
echo "• Update your client code to use: $SERVER_IP:29093"
echo ""
