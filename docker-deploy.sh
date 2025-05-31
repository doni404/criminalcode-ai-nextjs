#!/bin/bash

# Docker Deployment Script for Criminal Code AI
# Usage: ./docker-deploy.sh [development|production]

set -e

MODE=${1:-development}
echo "🚀 Deploying Criminal Code AI in $MODE mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ No .env file found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please edit .env file with your API keys before proceeding.${NC}"
        echo -e "${BLUE}Required variables:${NC}"
        echo "  - OPENAI_API_KEY"
        echo "  - QDRANT_API_KEY (optional for local)"
        read -p "Press Enter after updating .env file..."
    else
        echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Load environment variables
export $(cat .env | xargs)

if [ "$MODE" = "development" ]; then
    echo -e "${BLUE}🔧 Starting development environment...${NC}"
    
    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose down || true
    
    # Start only Qdrant for development
    echo "🗄️ Starting Qdrant database..."
    docker-compose up -d qdrant
    
    # Wait for Qdrant to be ready
    echo "⏳ Waiting for Qdrant to be ready..."
    timeout 60 bash -c 'until curl -f http://localhost:6333/health > /dev/null 2>&1; do sleep 2; done'
    
    echo -e "${GREEN}✅ Qdrant is ready at http://localhost:6333${NC}"
    echo -e "${BLUE}💡 Now run: npm run dev${NC}"
    echo -e "${BLUE}📱 Your app will be at: http://localhost:3000${NC}"
    
elif [ "$MODE" = "production" ]; then
    echo -e "${BLUE}🏭 Starting production environment...${NC}"
    
    # Build and start all services
    echo "🔨 Building application..."
    docker-compose build
    
    echo "🚀 Starting all services..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    timeout 120 bash -c 'until curl -f http://localhost:3000/api/init > /dev/null 2>&1; do sleep 5; done'
    
    echo -e "${GREEN}✅ Application is ready!${NC}"
    echo -e "${GREEN}🌐 Access your app at: http://localhost:3000${NC}"
    echo -e "${GREEN}🗄️ Qdrant dashboard: http://localhost:6333/dashboard${NC}"
    
    # Show container status
    echo -e "\n${BLUE}📊 Container Status:${NC}"
    docker-compose ps
    
else
    echo -e "${RED}❌ Invalid mode. Use 'development' or 'production'${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"

# Show useful commands
echo -e "\n${BLUE}📋 Useful commands:${NC}"
echo "  View logs:     docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart:       ./docker-deploy.sh $MODE"
echo "  Shell access:  docker-compose exec app sh" 