#!/bin/bash

# REMOTE PRODUCTION SERVER DIAGNOSTIC SCRIPT
# Run this script to quickly diagnose the production server issues

echo "🔍 STAIRS Production Server Diagnostic"
echo "======================================"
echo "Timestamp: $(date)"
echo "Server: 160.187.22.41"
echo ""

# Function to run command and capture output
run_check() {
    local description="$1"
    local command="$2"
    echo "🔍 Checking: $description"
    echo "Command: $command"
    echo "Result:"
    eval "$command" 2>&1 | head -10
    echo "----------------------------------------"
}

# Check server connectivity
run_check "Server SSH Connectivity" "ssh -o ConnectTimeout=5 root@160.187.22.41 'echo \"SSH connection successful\" && date'"

# Check backend port accessibility
run_check "Backend Port 5000 Accessibility" "nc -zv 160.187.22.41 5000 2>&1 || telnet 160.187.22.41 5000 2>&1 | head -3"

# Check frontend port accessibility  
run_check "Frontend Port 3008 Accessibility" "nc -zv 160.187.22.41 3008 2>&1 || telnet 160.187.22.41 3008 2>&1 | head -3"

# Try to get backend health
run_check "Backend Health Check" "curl -m 10 http://160.187.22.41:5000/health 2>&1"

# Check what's running on the server
run_check "Running Node Processes" "ssh -o ConnectTimeout=5 root@160.187.22.41 'ps aux | grep -E \"(node|npm|stairs)\" | grep -v grep'"

# Check PM2 status
run_check "PM2 Process Status" "ssh -o ConnectTimeout=5 root@160.187.22.41 'pm2 list 2>/dev/null || echo \"PM2 not found or not running\"'"

# Check listening ports
run_check "Listening Ports" "ssh -o ConnectTimeout=5 root@160.187.22.41 'netstat -tulpn | grep -E \":(5000|3008)\" || ss -tulpn | grep -E \":(5000|3008)\"'"

# Check disk space
run_check "Disk Space" "ssh -o ConnectTimeout=5 root@160.187.22.41 'df -h | head -5'"

# Check memory usage
run_check "Memory Usage" "ssh -o ConnectTimeout=5 root@160.187.22.41 'free -h'"

# Check system load
run_check "System Load" "ssh -o ConnectTimeout=5 root@160.187.22.41 'uptime'"

# Check recent system logs for errors
run_check "Recent System Errors" "ssh -o ConnectTimeout=5 root@160.187.22.41 'journalctl --since=\"1 hour ago\" | grep -i error | tail -5 || echo \"No recent errors found\"'"

echo ""
echo "🎯 QUICK FIXES TO TRY:"
echo "1. SSH into server: ssh root@160.187.22.41"
echo "2. Check backend directory: cd ~/stairs-new/backend && ls -la"
echo "3. Start backend: npm run dev"
echo "4. Check PM2: pm2 list && pm2 restart all"
echo "5. Check firewall: ufw status && ufw allow 5000"
echo ""
echo "📋 If backend starts successfully:"
echo "   Test: curl http://localhost:5000/health"
echo "   Then: Visit http://160.187.22.41:3008 and try login"
echo ""
echo "🚨 If issues persist, check PRODUCTION_SERVER_DIAGNOSTIC.md for detailed troubleshooting"