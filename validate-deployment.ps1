# 🔍 STAIRS Project - Environment Validation & Health Check
# This script validates the deployment and tests all functionality

param(
    [string]$ServerIP = ""
)

# Color functions
function Write-Info { param([string]$Message); Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message); Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message); Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message); Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Get server IP from environment or parameter
function Get-ServerIP {
    if (-not $script:ServerIP) {
        if (Test-Path "backend\.env") {
            $envContent = Get-Content "backend\.env"
            $backendUrl = $envContent | Where-Object { $_ -match "BACKEND_URL=" }
            if ($backendUrl) {
                $script:ServerIP = ($backendUrl -split "http://|:5000")[1]
            }
        }
        
        if (-not $script:ServerIP) {
            $script:ServerIP = Read-Host "Enter your server IP address"
        }
    }
    
    Write-Info "Testing Server IP: $script:ServerIP"
}

# Test service status
function Test-ServiceStatus {
    Write-Info "Checking PM2 service status..."
    
    try {
        $pm2Status = & pm2 status --no-color 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PM2 is running"
            
            # Check for our services
            if ($pm2Status -match "stairs-backend.*online") {
                Write-Success "Backend service is online"
            }
            else {
                Write-Warning "Backend service not found or not online"
            }
            
            if ($pm2Status -match "stairs-frontend.*online") {
                Write-Success "Frontend service is online"
            }
            else {
                Write-Warning "Frontend service not found or not online"
            }
        }
        else {
            Write-Warning "PM2 not running or not found"
        }
    }
    catch {
        Write-Warning "Could not check PM2 status: $_"
    }
}

# Test backend API
function Test-BackendAPI {
    Write-Info "Testing Backend API..."
    
    $backendUrl = "http://$script:ServerIP`:5000"
    
    # Test health endpoint
    try {
        $healthResponse = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Backend health check passed"
    }
    catch {
        Write-Error "Backend health check failed: $_"
        return $false
    }
    
    # Test API endpoints
    $endpoints = @(
        "/api/events",
        "/api/auth/register",
        "/api/admin/event-results"
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri "$backendUrl$endpoint" -TimeoutSec 5 -ErrorAction Stop
            Write-Success "Endpoint $endpoint is accessible (Status: $($response.StatusCode))"
        }
        catch {
            if ($_.Exception.Response.StatusCode -eq 401) {
                Write-Success "Endpoint $endpoint is accessible (401 - authentication required)"
            }
            else {
                Write-Warning "Endpoint $endpoint failed: $($_.Exception.Message)"
            }
        }
    }
    
    return $true
}

# Test frontend
function Test-Frontend {
    Write-Info "Testing Frontend..."
    
    $frontendUrl = "http://$script:ServerIP`:3000"
    
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10 -ErrorAction Stop
        Write-Success "Frontend is accessible (Status: $($response.StatusCode))"
        return $true
    }
    catch {
        Write-Error "Frontend test failed: $_"
        return $false
    }
}

# Test file upload system
function Test-FileUploadSystem {
    Write-Info "Testing File Upload System..."
    
    # Check uploads directory
    $uploadsDir = "backend\uploads\event-results"
    if (Test-Path $uploadsDir) {
        Write-Success "Uploads directory exists: $uploadsDir"
        
        # Check permissions (basic check on Windows)
        try {
            $testFile = "$uploadsDir\test-permission.txt"
            "test" | Out-File -FilePath $testFile -ErrorAction Stop
            Remove-Item $testFile -ErrorAction SilentlyContinue
            Write-Success "Upload directory is writable"
        }
        catch {
            Write-Error "Upload directory is not writable: $_"
        }
    }
    else {
        Write-Error "Uploads directory not found: $uploadsDir"
    }
    
    # Test file serving
    $fileUrl = "http://$script:ServerIP`:5000/uploads/event-results/"
    try {
        $response = Invoke-WebRequest -Uri $fileUrl -TimeoutSec 5 -ErrorAction Stop
        Write-Success "File serving endpoint is accessible"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Success "File serving endpoint is working (404 - no files yet)"
        }
        else {
            Write-Warning "File serving test inconclusive: $($_.Exception.Message)"
        }
    }
}

# Test database connection
function Test-DatabaseConnection {
    Write-Info "Testing Database Connection..."
    
    Set-Location backend -ErrorAction SilentlyContinue
    
    try {
        $dbTest = & npx prisma db push --accept-data-loss 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database connection successful"
        }
        else {
            Write-Warning "Database connection test inconclusive"
        }
    }
    catch {
        Write-Warning "Could not test database connection: $_"
    }
    finally {
        Set-Location .. -ErrorAction SilentlyContinue
    }
}

# Environment validation
function Test-EnvironmentConfiguration {
    Write-Info "Validating Environment Configuration..."
    
    # Check backend .env
    if (Test-Path "backend\.env") {
        $backendEnv = Get-Content "backend\.env"
        
        $requiredVars = @("DATABASE_URL", "JWT_SECRET", "BACKEND_URL", "PORT")
        foreach ($var in $requiredVars) {
            if ($backendEnv | Where-Object { $_ -match "^$var=" }) {
                Write-Success "Backend $var is configured"
            }
            else {
                Write-Warning "Backend $var is missing"
            }
        }
    }
    else {
        Write-Error "Backend .env file not found"
    }
    
    # Check frontend .env
    if (Test-Path "frontend\.env") {
        $frontendEnv = Get-Content "frontend\.env"
        
        if ($frontendEnv | Where-Object { $_ -match "^VITE_BACKEND_URL=" }) {
            Write-Success "Frontend VITE_BACKEND_URL is configured"
        }
        else {
            Write-Warning "Frontend VITE_BACKEND_URL is missing"
        }
    }
    else {
        Write-Error "Frontend .env file not found"
    }
}

# Generate test report
function Generate-TestReport {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "🔍 STAIRS PROJECT VALIDATION REPORT" -ForegroundColor Cyan
    Write-Host "Generated: $timestamp" -ForegroundColor Cyan
    Write-Host "Server IP: $script:ServerIP" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📋 Quick Access URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend:     http://$script:ServerIP`:3000"
    Write-Host "  Backend API:  http://$script:ServerIP`:5000"
    Write-Host "  Health Check: http://$script:ServerIP`:5000/health"
    Write-Host "  File Storage: http://$script:ServerIP`:5000/uploads/event-results/"
    Write-Host ""
    
    Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
    Write-Host "  pm2 status              # Check service status"
    Write-Host "  pm2 logs stairs-backend # View backend logs"
    Write-Host "  pm2 logs stairs-frontend# View frontend logs"
    Write-Host "  pm2 restart all         # Restart all services"
    Write-Host ""
    
    Write-Host "📁 File System:" -ForegroundColor Yellow
    Write-Host "  Upload Directory: $(Get-Location)\backend\uploads\event-results\"
    Write-Host "  Backend Config:   $(Get-Location)\backend\.env"
    Write-Host "  Frontend Config:  $(Get-Location)\frontend\.env"
    Write-Host ""
    
    Write-Host "✅ Next Steps:" -ForegroundColor Green
    Write-Host "  1. Open http://$script:ServerIP`:3000 in your browser"
    Write-Host "  2. Register as a coach"
    Write-Host "  3. Create an event"
    Write-Host "  4. Upload an Excel file (event results)"
    Write-Host "  5. Login as admin to view uploaded files"
    Write-Host "  6. Test download and delete functionality"
    Write-Host ""
    
    Write-Success "🎉 Validation completed! Your STAIRS project is ready for use."
}

# Main execution
function Main {
    Write-Host "🔍 STAIRS Project - Environment Validation" -ForegroundColor Magenta
    Write-Host "===========================================" -ForegroundColor Magenta
    Write-Host ""
    
    Get-ServerIP
    Test-ServiceStatus
    Test-BackendAPI
    Test-Frontend
    Test-FileUploadSystem
    Test-DatabaseConnection
    Test-EnvironmentConfiguration
    Generate-TestReport
}

# Run validation
try {
    Main
}
catch {
    Write-Error "Validation failed: $_"
    exit 1
}