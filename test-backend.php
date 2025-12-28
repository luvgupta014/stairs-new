<?php
/**
 * Test Backend Connection
 * Upload this to your website root and access via browser/curl
 * This will help debug backend connectivity issues
 */

header('Content-Type: text/plain');

$backendUrl = 'http://localhost:5000';
if (isset($_GET['backend'])) {
    $backendUrl = $_GET['backend'];
}

$eventId = $_GET['id'] ?? 'EVT-0051-OT-DL-271225';
$previewUrl = rtrim($backendUrl, '/') . '/api/events/preview/' . urlencode($eventId);

echo "=== Backend Connection Test ===\n\n";
echo "Backend URL: $backendUrl\n";
echo "Event ID: $eventId\n";
echo "Full URL: $previewUrl\n\n";

echo "Testing connection...\n";
echo str_repeat('-', 50) . "\n";

$ch = curl_init($previewUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_VERBOSE => false,
]);

$startTime = microtime(true);
$html = curl_exec($ch);
$endTime = microtime(true);
$duration = round(($endTime - $startTime) * 1000, 2);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$errorNum = curl_errno($ch);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
echo "Response Time: {$duration}ms\n";
echo "Response Size: " . strlen($html) . " bytes\n\n";

if ($errorNum !== 0) {
    echo "❌ CURL ERROR #$errorNum: $error\n\n";
} else {
    echo "✅ Connection successful\n\n";
}

if ($httpCode === 200 && $html) {
    echo "Response Preview:\n";
    echo str_repeat('-', 50) . "\n";
    echo substr($html, 0, 1000) . "\n";
    if (strlen($html) > 1000) {
        echo "\n... (truncated, total: " . strlen($html) . " bytes)\n";
    }
    echo str_repeat('-', 50) . "\n\n";
    
    // Check for OG tags
    $hasOgTitle = strpos($html, 'og:title') !== false;
    $hasOgDescription = strpos($html, 'og:description') !== false;
    $hasOgImage = strpos($html, 'og:image') !== false;
    
    echo "Meta Tag Check:\n";
    echo "  og:title: " . ($hasOgTitle ? '✅ Found' : '❌ Missing') . "\n";
    echo "  og:description: " . ($hasOgDescription ? '✅ Found' : '❌ Missing') . "\n";
    echo "  og:image: " . ($hasOgImage ? '✅ Found' : '❌ Missing') . "\n";
} else {
    echo "❌ Invalid response\n";
    if ($html) {
        echo "Response: " . substr($html, 0, 500) . "\n";
    }
}

echo "\n";
echo "=== Test Complete ===\n";
echo "\n";
echo "If connection fails, try:\n";
echo "1. Check backend is running: curl http://localhost:5000/health\n";
echo "2. Check backend port: grep PORT backend/.env\n";
echo "3. If backend on different server, use: ?backend=http://server-ip:5000\n";
?>

