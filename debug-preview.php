<?php
/**
 * Comprehensive Debug Script for Event Preview
 * Upload to website root and access via browser
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== EVENT PREVIEW DEBUG REPORT ===\n";
echo "Generated: " . date('Y-m-d H:i:s') . "\n\n";

// 1. File Check
echo "1. FILE CHECK\n";
echo str_repeat('-', 50) . "\n";
$htaccessExists = file_exists('.htaccess');
$phpFileExists = file_exists('event-preview.php');
echo ".htaccess: " . ($htaccessExists ? '✅ EXISTS' : '❌ NOT FOUND') . "\n";
echo "event-preview.php: " . ($phpFileExists ? '✅ EXISTS' : '❌ NOT FOUND') . "\n";

if ($htaccessExists) {
    $htaccessContent = file_get_contents('.htaccess');
    $hasEventRule = strpos($htaccessContent, 'event-preview.php') !== false;
    $hasBotDetection = strpos($htaccessContent, 'bot|crawler') !== false;
    echo ".htaccess has event rule: " . ($hasEventRule ? '✅ YES' : '❌ NO') . "\n";
    echo ".htaccess has bot detection: " . ($hasBotDetection ? '✅ YES' : '❌ NO') . "\n";
}
echo "\n";

// 2. Server Info
echo "2. SERVER INFORMATION\n";
echo str_repeat('-', 50) . "\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Server: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Script: " . __FILE__ . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A') . "\n";
echo "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'N/A') . "\n";
echo "\n";

// 3. Backend Connection Test
echo "3. BACKEND CONNECTION TEST\n";
echo str_repeat('-', 50) . "\n";
$backendUrl = 'http://localhost:5000';
$eventId = 'EVT-0051-OT-DL-271225';
$previewUrl = $backendUrl . '/api/events/preview/' . urlencode($eventId);

echo "Backend URL: $backendUrl\n";
echo "Test Event ID: $eventId\n";
echo "Preview URL: $previewUrl\n\n";

// Test if curl is available
if (!function_exists('curl_init')) {
    echo "❌ cURL extension not available!\n";
} else {
    echo "Testing backend connection...\n";
    
    $ch = curl_init($previewUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $errorNum = curl_errno($ch);
    curl_close($ch);
    
    if ($errorNum !== 0) {
        echo "❌ Connection Error: #$errorNum - $error\n";
        echo "\nTroubleshooting:\n";
        echo "- Is backend running? Run: ps aux | grep node\n";
        echo "- Is backend on port 5000? Check: grep PORT backend/.env\n";
        echo "- Can you access from server? Try: curl http://localhost:5000/health\n";
    } else {
        echo "HTTP Status: $httpCode\n";
        if ($httpCode === 200 && $html) {
            echo "✅ Backend responding\n";
            echo "Response size: " . strlen($html) . " bytes\n";
            
            $hasOgTitle = strpos($html, 'og:title') !== false;
            $hasOgDescription = strpos($html, 'og:description') !== false;
            echo "Has og:title: " . ($hasOgTitle ? '✅' : '❌') . "\n";
            echo "Has og:description: " . ($hasOgDescription ? '✅' : '❌') . "\n";
            
            if (!$hasOgTitle || !$hasOgDescription) {
                echo "\n⚠️  Backend returned HTML but missing OG tags!\n";
                echo "First 500 chars of response:\n";
                echo substr($html, 0, 500) . "\n";
            }
        } else {
            echo "❌ Backend returned HTTP $httpCode\n";
            if ($html) {
                echo "Response: " . substr($html, 0, 200) . "\n";
            }
        }
    }
}
echo "\n";

// 4. PHP Configuration
echo "4. PHP CONFIGURATION\n";
echo str_repeat('-', 50) . "\n";
echo "allow_url_fopen: " . (ini_get('allow_url_fopen') ? 'ON' : 'OFF') . "\n";
echo "curl extension: " . (function_exists('curl_init') ? '✅ Available' : '❌ Missing') . "\n";
echo "\n";

// 5. Apache/Server Check
echo "5. REWRITE MODULE CHECK\n";
echo str_repeat('-', 50) . "\n";
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    echo "mod_rewrite: " . (in_array('mod_rewrite', $modules) ? '✅ Loaded' : '❌ Not loaded') . "\n";
} else {
    echo "Cannot check Apache modules (function not available)\n";
    echo "Run manually: apache2ctl -M | grep rewrite\n";
}
echo "\n";

// 6. Recommendations
echo "6. RECOMMENDATIONS\n";
echo str_repeat('-', 50) . "\n";

$issues = [];

if (!$htaccessExists) {
    $issues[] = "Upload .htaccess file to website root";
}
if (!$phpFileExists) {
    $issues[] = "Upload event-preview.php file to website root";
}
if ($errorNum !== 0) {
    $issues[] = "Fix backend connection - backend may not be running";
}
if (!function_exists('curl_init')) {
    $issues[] = "Install/enable PHP cURL extension";
}

if (empty($issues)) {
    echo "✅ No obvious issues detected!\n";
    echo "\nNext steps:\n";
    echo "1. Test: curl -I -H 'User-Agent: facebookexternalhit/1.1' https://yourdomain.com/event/EVT-XXXX\n";
    echo "2. Test: curl https://yourdomain.com/event-preview.php?id=EVT-XXXX\n";
    echo "3. Use Facebook Debugger to verify\n";
} else {
    echo "⚠️  Issues found:\n";
    foreach ($issues as $i => $issue) {
        echo "   " . ($i + 1) . ". $issue\n";
    }
}

echo "\n";
echo "=== END DEBUG REPORT ===\n";
?>

