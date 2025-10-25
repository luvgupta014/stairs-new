#!/bin/bash

# 🏢 STAIRS Project - Local Data Center Setup Script
# This script automates the deployment process for local data center hosting

set -e  # Exit on any error

echo "🚀 Starting STAIRS Local Data Center Deployment..."

# Color codes for output
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

# Get server IP
get_server_ip() {
    if command -v ip >/dev/null 2>&1; then
        # Linux
        SERVER_IP=$(ip route get 8.8.8.8 | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')
    elif command -v ifconfig >/dev/null 2>&1; then
        # macOS/BSD
        SERVER_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    else
        print_warning "Could not auto-detect IP. Please enter manually."
        read -p "Enter your server IP address: " SERVER_IP
    fi
    
    print_status "Detected Server IP: $SERVER_IP"
    read -p "Is this correct? (y/n): " confirm
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        read -p "Enter your server IP address: " SERVER_IP
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check PostgreSQL (optional check)
    if command -v psql >/dev/null 2>&1; then
        print_success "PostgreSQL found"
    else
        print_warning "PostgreSQL not found. Make sure it's installed and running."
    fi
    
    print_success "Prerequisites check completed"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Setup environment
    if [ -f "../.env.production.template" ]; then
        cp ../.env.production.template .env
        print_success "Environment template copied"
    else
        print_error "Environment template not found!"
        exit 1
    fi
    
    # Replace placeholder with actual IP
    sed -i "s/YOUR_SERVER_IP/$SERVER_IP/g" .env
    print_success "Environment configured with IP: $SERVER_IP"
    
    # Create uploads directory
    mkdir -p uploads/event-results
    chmod 755 uploads/event-results
    print_success "Uploads directory created"
    
    # Database setup
    print_status "Setting up database..."
    if npx prisma db push; then
        print_success "Database schema applied"
    else
        print_warning "Database setup failed. Please check your DATABASE_URL in .env"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Setup environment
    if [ -f "../.env.production.template" ]; then
        cp ../.env.production.template .env
        print_success "Frontend environment template copied"
    else
        print_error "Frontend environment template not found!"
        exit 1
    fi
    
    # Replace placeholder with actual IP
    sed -i "s/YOUR_SERVER_IP/$SERVER_IP/g" .env
    print_success "Frontend environment configured with IP: $SERVER_IP"
    
    # Build frontend
    print_status "Building frontend for production..."
    if npm run build; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
}

# Install PM2 for process management
setup_pm2() {
    print_status "Setting up PM2 for process management..."
    
    if ! command -v pm2 >/dev/null 2>&1; then
        print_status "Installing PM2..."
        npm install -g pm2
        print_success "PM2 installed"
    else
        print_success "PM2 already installed"
    fi
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Stop existing services if running
    pm2 delete stairs-backend 2>/dev/null || true
    pm2 delete stairs-frontend 2>/dev/null || true
    
    # Start backend
    print_status "Starting backend service..."
    cd backend
    pm2 start src/index.js --name "stairs-backend"
    cd ..
    
    # Start frontend
    print_status "Starting frontend service..."
    cd frontend
    pm2 start "npm run preview -- --host 0.0.0.0 --port 3000" --name "stairs-frontend"
    cd ..
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    print_success "Services started successfully"
}

# Display final information
show_completion_info() {
    print_success "🎉 STAIRS Local Data Center Deployment Complete!"
    echo ""
    echo "📋 Access Information:"
    echo "  Frontend URL: http://$SERVER_IP:3000"
    echo "  Backend API:  http://$SERVER_IP:5000"
    echo "  Health Check: http://$SERVER_IP:5000/health"
    echo ""
    echo "📁 File Storage:"
    echo "  Upload Directory: $(pwd)/backend/uploads/event-results/"
    echo "  File Access URL: http://$SERVER_IP:5000/uploads/event-results/filename.xlsx"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View status:     pm2 status"
    echo "  View logs:       pm2 logs"
    echo "  Restart backend: pm2 restart stairs-backend"
    echo "  Restart frontend: pm2 restart stairs-frontend"
    echo "  Stop all:        pm2 stop all"
    echo ""
    echo "✅ Test your deployment:"
    echo "  1. Open http://$SERVER_IP:3000 in browser"
    echo "  2. Register as coach and create event"
    echo "  3. Upload Excel file (event results)"
    echo "  4. Verify file appears in admin panel"
    echo "  5. Test download functionality"
    echo ""
    print_success "Deployment completed successfully! 🚀"
}

# Main execution
main() {
    echo "🏢 STAIRS Project - Local Data Center Deployment"
    echo "================================================="
    
    get_server_ip
    check_prerequisites
    setup_backend
    setup_frontend
    setup_pm2
    start_services
    show_completion_info
}

# Run main function
main

print_status "Setup script completed. Check PM2 status with: pm2 status"