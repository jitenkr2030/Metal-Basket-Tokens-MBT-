#!/bin/bash

# MBT Platform Deployment Script
# Metal Basket Tokens - Automated Deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="MBT"
PROJECT_DIR="/workspace/RWA-tokenization/mbt_project"
BACKEND_PORT=3003
FRONTEND_PORT=3000
REDIS_PORT=6379
POSTGRES_PORT=5432

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        warning "Node.js not found. Some features may not work."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        warning "npm not found. Installing dependencies may fail."
    fi
    
    success "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    log "Setting up environment variables..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# MBT Platform Environment Configuration
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://mbt_user:password@localhost:5432/mbt_platform
MONGODB_URI=mongodb://localhost:27017/mbt_audit
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# API Keys (Update with your actual keys)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
UIDAI_API_KEY=your_uidai_key

# Vault Partners
MMTC_PAMP_API_KEY=your_mmtc_key
SAFEGOLD_API_KEY=your_safegold_key
AUGMONT_API_KEY=your_augmont_key

# Blockchain Configuration
HYPERLEDGER_CONNECTION_PROFILE=./config/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY=mbt-admin

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
EOF
        success "Created .env file with default configuration"
        warning "Please update the API keys and configuration in .env file"
    else
        success ".env file already exists"
    fi
}

# Setup databases
setup_databases() {
    log "Setting up databases..."
    
    # Create database directories
    mkdir -p data/postgres
    mkdir -p data/mongo
    
    # Set permissions
    chmod -R 755 data/
    
    success "Database directories created"
}

# Install backend dependencies
install_backend_dependencies() {
    log "Installing backend dependencies..."
    
    cd "$PROJECT_DIR/backend"
    
    if [ -f "package.json" ]; then
        npm install
        success "Backend dependencies installed"
    else
        error "package.json not found in backend directory"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
}

# Setup blockchain network
setup_blockchain() {
    log "Setting up Hyperledger Fabric network..."
    
    # Create blockchain directories
    mkdir -p blockchain/network
    mkdir -p blockchain/chaincodes
    mkdir -p blockchain/wallet
    
    # Create basic network configuration
    cat > blockchain/network/configtx.yaml << EOF
Organizations:
  - &MBT
    Name: MBTMSP
    ID: MBTMSP
    MSPDir: crypto-config/peerOrganizations/mbt.example.com/msp
    AnchorPeers:
      - Host: peer0.mbt.example.com
        Port: 7051

Application: &ApplicationDefaults
  Organizations:
    - *MBT
    Policies:
      Readers:
        Type: ImplicitMeta
        Rule: "ANY Readers"
      Writers:
        Type: ImplicitMeta
        Rule: "ANY Writers"
      Admins:
        Type: ImplicitMeta
        Rule: "MAJORITY Admins"

Capabilities:
  Application: &ApplicationCapabilities
    V1_3: true

Orderer: &OrdererDefaults
  OrdererType: solo
  Addresses:
    - orderer.example.com:7050
  BatchTimeout: 2s
  BatchSize:
    MaxMessageCount: 10
    AbsoluteMaxBytes: 99 MB
    PreferredMaxBytes: 512 KB
  Organizations:

Capabilities:
  Orderer: &OrdererCapabilities
    V1_1: true

Channel: &ChannelDefaults
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
  Capabilities:
    V1_3: true

Profiles:
  MBTOrdererGenesis:
    Orderer:
      <<: *OrdererDefaults
      Organizations:
        - *OrdererOrg
    Consortiums:
      MBTConsortium:
        Organizations:
          - *MBT
  MBTChannel:
    Consortium: MBTConsortium
    Application:
      <<: *ApplicationDefaults
      Organizations:
        - *MBT
EOF

    # Create basic chaincode deployment script
    cat > blockchain/scripts/deploy-chaincodes.sh << 'EOF'
#!/bin/bash

set -e

CHAINCODE_DIR="../chaincodes"
CHANNEL_NAME="mbt-channel"

echo "Deploying MBT chaincodes to channel $CHANNEL_NAME..."

# Deploy MBT Basket Chaincode
echo "Deploying MBT Basket Chaincode..."
peer chaincode install -n mbt_basket -v 1.0 -p "$CHAINCODE_DIR/mbt_basket"

peer chaincode instantiate -o localhost:7050 \
  -C "$CHANNEL_NAME" \
  -n mbt_basket \
  -v 1.0 \
  -c '{"Args":["InitLedger"]}' \
  -P "OR('MBTMSP.member')"

# Deploy Rebalancing Chaincode
echo "Deploying MBT Rebalancing Chaincode..."
peer chaincode install -n mbt_rebalancing -v 1.0 -p "$CHAINCODE_DIR/mbt_rebalancing"

peer chaincode instantiate -o localhost:7050 \
  -C "$CHANNEL_NAME" \
  -n mbt_rebalancing \
  -v 1.0 \
  -c '{"Args":["InitPolicy"]}' \
  -P "OR('MBTMSP.member')"

echo "Chaincode deployment completed!"
EOF

    chmod +x blockchain/scripts/deploy-chaincodes.sh
    
    success "Blockchain network configuration created"
}

# Setup frontend
setup_frontend() {
    log "Setting up frontend..."
    
    # Create serving configuration for frontend
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:3003/api
VITE_WS_URL=ws://localhost:3003
VITE_APP_NAME=MBT Platform
VITE_APP_VERSION=1.0.0
EOF
        success "Frontend environment file created"
    fi
}

# Start services
start_services() {
    log "Starting MBT platform services..."
    
    # Start database services first
    log "Starting databases..."
    docker-compose up -d postgres mongo redis
    
    # Wait for databases to be ready
    log "Waiting for databases to be ready..."
    sleep 10
    
    # Start application services
    log "Starting application services..."
    docker-compose up -d mbt-api
    
    # Start frontend
    log "Starting frontend..."
    cd frontend
    if [ -f "package.json" ]; then
        npm install
        npm run dev &
    else
        # Use simple HTTP server
        python3 -m http.server 3000 &
    fi
    cd ..
    
    success "Services started"
}

# Deploy to production
deploy_production() {
    log "Deploying to production environment..."
    
    # Build production images
    log "Building production Docker images..."
    docker-compose -f docker-compose.prod.yml build
    
    # Deploy to production
    log "Deploying to production..."
    docker-compose -f docker-compose.prod.yml up -d
    
    success "Production deployment completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and observability..."
    
    # Create monitoring directory
    mkdir -p monitoring
    
    # Prometheus configuration
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mbt-api'
    static_configs:
      - targets: ['mbt-api:3003']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 30s

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 30s

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s
EOF

    # Grafana dashboard configuration
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    cat > monitoring/grafana/datasources/datasource.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    success "Monitoring configuration created"
}

# Create Docker Compose files
create_docker_compose() {
    log "Creating Docker Compose configuration..."
    
    # Development docker-compose.yml
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  mbt-api:
    build: ./backend
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://mbt_user:password@postgres:5432/mbt_platform
      - MONGODB_URI=mongodb://mongo:27017/mbt_audit
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - mongo
      - redis
    restart: unless-stopped
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - mbt-network

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=mbt_platform
      - POSTGRES_USER=mbt_user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - mbt-network

  mongo:
    image: mongo:6.0
    environment:
      - MONGO_INITDB_DATABASE=mbt_audit
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    networks:
      - mbt-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - mbt-network

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped
    networks:
      - mbt-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    restart: unless-stopped
    networks:
      - mbt-network

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  mbt-network:
    driver: bridge
EOF

    # Production docker-compose.yml
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  mbt-api:
    image: mbt/api:latest
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://mbt_user:\${POSTGRES_PASSWORD}@postgres:5432/mbt_platform
      - MONGODB_URI=mongodb://mongo:27017/mbt_audit
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - mongo
      - redis
    restart: always
    networks:
      - mbt-network
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - mbt-api
    restart: always
    networks:
      - mbt-network

volumes:
  postgres_data:
  mongo_data:
  redis_data:

networks:
  mbt-network:
    driver: bridge
EOF

    success "Docker Compose files created"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p nginx/ssl
    
    # Generate self-signed certificate for development
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout nginx/ssl/mbt.key \
      -out nginx/ssl/mbt.crt \
      -subj "/C=IN/ST=KA/L=Bangalore/O=MBT/CN=localhost"
    
    # Set permissions
    chmod 600 nginx/ssl/mbt.key
    chmod 644 nginx/ssl/mbt.crt
    
    success "SSL certificates created (self-signed for development)"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if services are running
    services=("mbt-api:3003/health" "postgres" "mongo" "redis")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        
        if [ "$port" == "postgres" ]; then
            # Check PostgreSQL
            if docker exec $(docker-compose ps -q postgres) pg_isready -U mbt_user; then
                success "PostgreSQL is healthy"
            else
                error "PostgreSQL health check failed"
            fi
        elif [ "$port" == "mongo" ]; then
            # Check MongoDB
            if docker exec $(docker-compose ps -q mongo) mongosh --eval "db.runCommand('ping')"; then
                success "MongoDB is healthy"
            else
                error "MongoDB health check failed"
            fi
        elif [ "$port" == "redis" ]; then
            # Check Redis
            if docker exec $(docker-compose ps -q redis) redis-cli ping | grep -q PONG; then
                success "Redis is healthy"
            else
                error "Redis health check failed"
            fi
        else
            # Check HTTP endpoint
            if curl -f -s http://localhost:$port > /dev/null; then
                success "$name is healthy"
            else
                warning "$name health check failed or not responding"
            fi
        fi
    done
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_dir="backups/$timestamp"
    mkdir -p "$backup_dir"
    
    # Backup PostgreSQL
    docker exec $(docker-compose ps -q postgres) pg_dump -U mbt_user mbt_platform > "$backup_dir/postgres_backup.sql"
    
    # Backup MongoDB
    docker exec $(docker-compose ps -q mongo) mongodump --db mbt_audit --out /tmp/backup
    docker cp $(docker-compose ps -q mongo):/tmp/backup "$backup_dir/mongodb_backup"
    
    success "Database backup created in $backup_dir"
}

# Cleanup
cleanup() {
    log "Cleaning up containers and images..."
    
    # Stop and remove containers
    docker-compose down
    
    # Remove volumes (optional, will delete data)
    read -p "Do you want to remove all data volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        warning "All data volumes removed"
    fi
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    echo "=============================================="
    echo "MBT Platform Deployment Script"
    echo "Metal Basket Tokens - Automated Setup"
    echo "=============================================="
    
    # Parse command line arguments
    case "${1:-install}" in
        "install")
            log "Starting MBT platform installation..."
            check_prerequisites
            setup_environment
            setup_databases
            install_backend_dependencies
            setup_blockchain
            setup_frontend
            create_docker_compose
            setup_ssl
            setup_monitoring
            start_services
            health_check
            success "MBT platform installation completed!"
            echo ""
            echo "=============================================="
            echo "🚀 MBT Platform is now running!"
            echo ""
            echo "Access Points:"
            echo "• Web Application: http://localhost:3000"
            echo "• API Server: http://localhost:3003"
            echo "• API Health: http://localhost:3003/health"
            echo "• Prometheus: http://localhost:9090"
            echo "• Grafana: http://localhost:3001 (admin/admin)"
            echo "=============================================="
            ;;
        "production")
            log "Deploying MBT platform to production..."
            deploy_production
            success "Production deployment completed!"
            ;;
        "backup")
            backup_database
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            health_check
            ;;
        "help")
            echo "MBT Platform Deployment Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  install      Install and start MBT platform (default)"
            echo "  production   Deploy to production environment"
            echo "  backup       Create database backup"
            echo "  cleanup      Stop services and clean up"
            echo "  health       Check service health"
            echo "  help         Show this help message"
            ;;
        *)
            error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Change to project directory
cd "$PROJECT_DIR"

# Run main function with all arguments
main "$@"