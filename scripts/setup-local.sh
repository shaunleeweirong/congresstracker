#!/bin/bash

# Congressional Trading Transparency Platform
# Local Development Setup Script
# Created: 2025-09-24

set -e  # Exit on any error

echo "🏛️  Congressional Trading Transparency Platform - Local Setup"
echo "============================================================"

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Docker will be used for development."
    else
        NODE_VERSION=$(node --version)
        print_status "Node.js version: $NODE_VERSION"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_warning "npm is not installed. Docker will be used for development."
    else
        NPM_VERSION=$(npm --version)
        print_status "npm version: $NPM_VERSION"
    fi
    
    print_success "Prerequisites check completed"
}

# Create environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend/.env from example..."
        cp backend/.env.example backend/.env
        
        # Generate JWT secret
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_jwt_secret_key_here_minimum_32_characters")
        if command -v openssl &> /dev/null; then
            sed -i.bak "s/your_super_secret_jwt_key_here_minimum_32_characters/$JWT_SECRET/" backend/.env
            rm backend/.env.bak 2>/dev/null || true
        fi
        
        print_warning "Please update backend/.env with your FMP API key"
    else
        print_status "backend/.env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        print_status "Creating frontend/.env.local from example..."
        cp frontend/.env.local.example frontend/.env.local
        
        # Generate NextAuth secret
        NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_nextauth_secret_here_minimum_32_characters")
        if command -v openssl &> /dev/null; then
            sed -i.bak "s/your_nextauth_secret_here_minimum_32_characters/$NEXTAUTH_SECRET/" frontend/.env.local
            rm frontend/.env.local.bak 2>/dev/null || true
        fi
    else
        print_status "frontend/.env.local already exists"
    fi
    
    print_success "Environment files setup completed"
}

# Install dependencies locally (optional)
install_dependencies() {
    if command -v npm &> /dev/null; then
        print_status "Installing dependencies locally..."
        
        # Backend dependencies
        if [ -f "backend/package.json" ]; then
            print_status "Installing backend dependencies..."
            cd backend && npm install && cd ..
        fi
        
        # Frontend dependencies
        if [ -f "frontend/package.json" ]; then
            print_status "Installing frontend dependencies..."
            cd frontend && npm install && cd ..
        fi
        
        print_success "Dependencies installed locally"
    else
        print_warning "npm not available, skipping local dependency installation"
    fi
}

# Start database services
start_database() {
    print_status "Starting database services..."
    
    # Start PostgreSQL and Redis
    docker-compose up -d postgres redis
    
    # Wait for services to be healthy
    print_status "Waiting for database services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    until docker-compose exec postgres pg_isready -U postgres -d congresstracker > /dev/null 2>&1; do
        sleep 2
        echo -n "."
    done
    echo
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
        echo -n "."
    done
    echo
    
    print_success "Database services are ready"
}

# Run database migrations and seeds
setup_database() {
    print_status "Setting up database schema and test data..."
    
    # Run migrations
    print_status "Running database migrations..."
    docker-compose exec postgres psql -U postgres -d congresstracker -f /docker-entrypoint-initdb.d/migrations/001_initial_schema.sql
    
    # Run seeds
    print_status "Seeding test data..."
    docker-compose exec postgres psql -U postgres -d congresstracker -f /docker-entrypoint-initdb.d/migrations/../seeds/001_test_data.sql
    
    print_success "Database setup completed"
}

# Display connection information
show_connection_info() {
    print_success "Setup completed! 🎉"
    echo
    echo "🔗 Connection Information:"
    echo "========================"
    echo "📊 PostgreSQL: localhost:5432"
    echo "   Database: congresstracker"
    echo "   Username: postgres" 
    echo "   Password: password123"
    echo
    echo "🔴 Redis: localhost:6379"
    echo
    echo "🚀 Next Steps:"
    echo "============="
    echo "1. Update backend/.env with your FMP API key"
    echo "2. Start the development servers:"
    echo "   npm run dev:backend    # Start backend API"
    echo "   npm run dev:frontend   # Start frontend"
    echo "   # OR use Docker:"
    echo "   docker-compose --profile dev up"
    echo
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo
    echo "📚 Test Users (password: password123):"
    echo "   test@example.com"
    echo "   demo@example.com"
    echo "   admin@example.com"
}

# Add package.json scripts for easier development
add_npm_scripts() {
    if [ -f "package.json" ]; then
        print_status "package.json already exists"
    else
        print_status "Creating root package.json with dev scripts..."
        cat > package.json << 'EOF'
{
  "name": "congresstracker",
  "version": "1.0.0",
  "description": "Congressional Trading Transparency Platform",
  "private": true,
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev", 
    "dev:docker": "docker-compose --profile dev up",
    "dev:db": "docker-compose up -d postgres redis",
    "setup": "./scripts/setup-local.sh",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "lint": "cd backend && npm run lint && cd ../frontend && npm run lint",
    "format": "cd backend && npm run format && cd ../frontend && npm run format"
  },
  "keywords": [
    "congressional-trading",
    "transparency",
    "stock-trading",
    "politics"
  ],
  "author": "Congressional Tracker Team",
  "license": "MIT"
}
EOF
        print_success "Root package.json created"
    fi
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    add_npm_scripts
    install_dependencies
    start_database
    setup_database
    show_connection_info
}

# Parse command line arguments
case "${1:-}" in
    --db-only)
        print_status "Setting up database services only..."
        start_database
        setup_database
        ;;
    --env-only)
        print_status "Setting up environment files only..."
        setup_environment
        ;;
    --help|-h)
        echo "Usage: $0 [option]"
        echo "Options:"
        echo "  --db-only    Setup database services only"
        echo "  --env-only   Setup environment files only"
        echo "  --help, -h   Show this help message"
        echo "  (no args)    Full setup"
        ;;
    *)
        main
        ;;
esac