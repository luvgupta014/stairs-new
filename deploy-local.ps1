# 🏢 STAIRS Project - Local Data Center Setup Script (Windows PowerShell)
# This script automates the deployment process for local data center hosting on Windows

param(
    [string]$ServerIP = ""
)

# Color functions for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Get server IP
function Get-ServerIP {
    if (-not $script:ServerIP) {
        try {
            # Get local IP address
            $script:ServerIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -notmatch "169.254"} | Select-Object -First 1).IPAddress
            
            if (-not $script:ServerIP) {
                $script:ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notmatch "127.0.0.1|169.254"} | Select-Object -First 1).IPAddress
            }
        }
        catch {
            Write-Warning "Could not auto-detect IP address."
        }
        
        if ($script:ServerIP) {
            Write-Info "Detected Server IP: $script:ServerIP"
            $confirm = Read-Host "Is this correct? (y/n)"
            if ($confirm -ne "y" -and $confirm -ne "Y") {
                $script:ServerIP = Read-Host "Enter your server IP address"
            }
        }
        else {
            $script:ServerIP = Read-Host "Enter your server IP address"
        }
    }
    
    Write-Info "Using Server IP: $script:ServerIP"
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Node.js not found"
        }
        
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNumber -lt 18) {
            throw "Node.js version 18+ required. Current: $nodeVersion"
        }
        
        Write-Success "Node.js version $nodeVersion found"
    }
    catch {
        Write-Error "Node.js 18+ is required but not found. Please install Node.js first."
        exit 1
    }
    
    # Check npm
    try {
        & npm --version 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "npm not found"
        }
        Write-Success "npm found"
    }
    catch {
        Write-Error "npm is not installed."
        exit 1
    }
    
    Write-Success "Prerequisites check completed"
}

# Setup backend
function Setup-Backend {
    Write-Info "Setting up backend..."
    
    Set-Location backend
    
    # Install dependencies
    Write-Info "Installing backend dependencies..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install backend dependencies"
        exit 1
    }
    
    # Setup environment
    if (Test-Path "../.env.production.template") {
        Copy-Item "../.env.production.template" ".env"
        Write-Success "Environment template copied"
    }
    else {
        Write-Error "Environment template not found!"
        exit 1
    }
    
    # Replace placeholder with actual IP
    (Get-Content ".env") -replace "YOUR_SERVER_IP", $script:ServerIP | Set-Content ".env"
    Write-Success "Environment configured with IP: $script:ServerIP"
    
    # Create uploads directory
    $uploadsPath = "uploads\event-results"
    if (-not (Test-Path $uploadsPath)) {
        New-Item -ItemType Directory -Path $uploadsPath -Force | Out-Null
        Write-Success "Uploads directory created"
    }
    else {
        Write-Success "Uploads directory already exists"
    }
    
    # Database setup
    Write-Info "Setting up database..."
    & npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database schema applied"
    }
    else {
        Write-Warning "Database setup failed. Please check your DATABASE_URL in .env"
    }
    
    Set-Location ..
}

# Setup frontend
function Setup-Frontend {
    Write-Info "Setting up frontend..."
    
    Set-Location frontend
    
    # Install dependencies
    Write-Info "Installing frontend dependencies..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install frontend dependencies"
        exit 1
    }
    
    # Setup environment
    if (Test-Path "../.env.production.template") {
        Copy-Item "../.env.production.template" ".env"
        Write-Success "Frontend environment template copied"
    }
    else {
        Write-Error "Frontend environment template not found!"
        exit 1
    }
    
    # Replace placeholder with actual IP
    (Get-Content ".env") -replace "YOUR_SERVER_IP", $script:ServerIP | Set-Content ".env"
    Write-Success "Frontend environment configured with IP: $script:ServerIP"
    
    # Build frontend
    Write-Info "Building frontend for production..."
    & npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend built successfully"
    }
    else {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    Set-Location ..
}

# Install PM2 for process management
function Setup-PM2 {
    Write-Info "Setting up PM2 for process management..."
    
    try {
        & pm2 --version 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "PM2 not found"
        }
        Write-Success "PM2 already installed"
    }
    catch {
        Write-Info "Installing PM2..."
        & npm install -g pm2
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PM2 installed"
        }
        else {
            Write-Error "Failed to install PM2"
            exit 1
        }
    }
}

# Start services
function Start-Services {
    Write-Info "Starting services..."
    
    # Stop existing services if running
    & pm2 delete stairs-backend 2>$null
    & pm2 delete stairs-frontend 2>$null
    
    # Start backend
    Write-Info "Starting backend service..."
    Set-Location backend
    & pm2 start src/index.js --name "stairs-backend"
    Set-Location ..
    
    # Start frontend
    Write-Info "Starting frontend service..."
    Set-Location frontend
    & pm2 start "npm run preview -- --host 0.0.0.0 --port 3000" --name "stairs-frontend"
    Set-Location ..
    
    # Save PM2 configuration
    & pm2 save
    & pm2 startup
    
    Write-Success "Services started successfully"
}

# Display final information
function Show-CompletionInfo {
    Write-Success "🎉 STAIRS Local Data Center Deployment Complete!"
    Write-Host ""
    Write-Host "📋 Access Information:" -ForegroundColor Cyan
    Write-Host "  Frontend URL: http://$script:ServerIP`:3000"
    Write-Host "  Backend API:  http://$script:ServerIP`:5000"
    Write-Host "  Health Check: http://$script:ServerIP`:5000/health"
    Write-Host ""
    Write-Host "📁 File Storage:" -ForegroundColor Cyan
    Write-Host "  Upload Directory: $(Get-Location)\backend\uploads\event-results\"
    Write-Host "  File Access URL: http://$script:ServerIP`:5000/uploads/event-results/filename.xlsx"
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
    Write-Host "  View status:      pm2 status"
    Write-Host "  View logs:        pm2 logs"
    Write-Host "  Restart backend:  pm2 restart stairs-backend"
    Write-Host "  Restart frontend: pm2 restart stairs-frontend"
    Write-Host "  Stop all:         pm2 stop all"
    Write-Host ""
    Write-Host "✅ Test your deployment:" -ForegroundColor Cyan
    Write-Host "  1. Open http://$script:ServerIP`:3000 in browser"
    Write-Host "  2. Register as coach and create event"
    Write-Host "  3. Upload Excel file (event results)"
    Write-Host "  4. Verify file appears in admin panel"
    Write-Host "  5. Test download functionality"
    Write-Host ""
    Write-Success "Deployment completed successfully! 🚀"
}

# Main execution
function Main {
    Write-Host "🏢 STAIRS Project - Local Data Center Deployment" -ForegroundColor Magenta
    Write-Host "=================================================" -ForegroundColor Magenta
    
    Get-ServerIP
    Test-Prerequisites
    Setup-Backend
    Setup-Frontend
    Setup-PM2
    Start-Services
    Show-CompletionInfo
}

# Error handling
trap {
    Write-Error "An error occurred: $_"
    Write-Info "Setup script failed. Check the error above."
    exit 1
}

# Run main function
try {
    Main
    Write-Info "Setup script completed. Check PM2 status with: pm2 status"
}
catch {
    Write-Error "Setup failed: $_"
    exit 1
}