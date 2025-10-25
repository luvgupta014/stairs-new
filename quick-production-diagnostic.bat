@echo off
REM WINDOWS BATCH VERSION - REMOTE PRODUCTION SERVER DIAGNOSTIC

echo 🔍 STAIRS Production Server Diagnostic
echo ======================================
echo Timestamp: %date% %time%
echo Server: 160.187.22.41
echo.

echo 🔍 Checking Backend Port 5000 Accessibility...
powershell -Command "try { Test-NetConnection -ComputerName '160.187.22.41' -Port 5000 -InformationLevel Quiet } catch { 'Failed' }"
echo.

echo 🔍 Checking Frontend Port 3008 Accessibility...  
powershell -Command "try { Test-NetConnection -ComputerName '160.187.22.41' -Port 3008 -InformationLevel Quiet } catch { 'Failed' }"
echo.

echo 🔍 Testing Backend Health Check...
powershell -Command "try { (Invoke-WebRequest -Uri 'http://160.187.22.41:5000/health' -TimeoutSec 10 -UseBasicParsing).Content } catch { 'Backend not responding: ' + $_.Exception.Message }"
echo.

echo 🔍 Testing Frontend Accessibility...
powershell -Command "try { (Invoke-WebRequest -Uri 'http://160.187.22.41:3008' -TimeoutSec 10 -UseBasicParsing).StatusCode } catch { 'Frontend issue: ' + $_.Exception.Message }"
echo.

echo 🎯 DIAGNOSIS RESULTS:
echo ==================
echo If Backend Port 5000 shows "False" or "Failed": Backend service is down
echo If Backend Health shows error: Service not running or crashed
echo If Frontend Port 3008 shows "False": Frontend service is down  
echo If Frontend shows 200: Frontend is running but backend connection failed
echo.

echo 🚨 IMMEDIATE ACTIONS NEEDED:
echo 1. SSH into production server: ssh root@160.187.22.41
echo 2. Navigate to backend: cd ~/stairs-new/backend
echo 3. Check if backend is running: ps aux ^| grep node
echo 4. Start backend if not running: npm run dev
echo 5. Check PM2 processes: pm2 list
echo 6. Restart if needed: pm2 restart all
echo.

echo 📋 VERIFICATION:
echo After starting backend, test: curl http://localhost:5000/health
echo Then visit: http://160.187.22.41:3008 and try login
echo.

pause