<?php
/**
 * Event Link Preview Handler for Social Media
 * This file serves HTML with meta tags for social media crawlers
 * Works without Apache proxy configuration - PHP handles the backend request
 */

// Get event uniqueId from URL
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim($requestUri, '/'));

// Extract uniqueId from /event/EVT-XXXX-XX-XX-XXXXXX or /event-preview/EVT-XXXX-XX-XX-XXXXXX
$uniqueId = null;
foreach ($pathParts as $i => $part) {
    if (($part === 'event' || $part === 'event-preview') && isset($pathParts[$i + 1])) {
        $uniqueId = $pathParts[$i + 1];
        break;
    }
}

// If no uniqueId found, try query parameter
if (!$uniqueId && isset($_GET['id'])) {
    $uniqueId = $_GET['id'];
}

if (!$uniqueId) {
    // No event ID found - serve default STAIRS page
    serveDefaultPreview();
    exit;
}

// Backend URL - adjust if your backend is on a different host/port
$backendUrl = 'http://localhost:5000';
if (isset($_ENV['BACKEND_URL'])) {
    $backendUrl = $_ENV['BACKEND_URL'];
}

// Fetch event preview from backend
$previewUrl = rtrim($backendUrl, '/') . '/api/events/preview/' . urlencode($uniqueId);

// Initialize cURL
$ch = curl_init($previewUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT => $_SERVER['HTTP_USER_AGENT'] ?? 'EventPreviewBot/1.0',
    CURLOPT_HTTPHEADER => [
        'Accept: text/html',
        'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? ''),
        'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) ? 'https' : 'http'),
    ]
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// If backend returns valid HTML, serve it
if ($httpCode === 200 && $html && strpos($html, '<meta property="og:title"') !== false) {
    // Set proper headers
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400');
    header('X-Robots-Tag: noindex');
    
    echo $html;
    exit;
}

// If backend request failed, generate fallback HTML
serveFallbackPreview($uniqueId, $error);

function serveDefaultPreview() {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event Not Found | STAIRS Talent Hub</title>
    <meta property="og:title" content="Event Not Found | STAIRS Talent Hub" />
    <meta property="og:description" content="The event you are looking for could not be found." />
    <meta property="og:site_name" content="STAIRS Talent Hub" />
</head>
<body>
    <h1>Event Not Found</h1>
    <p>The event you are looking for could not be found.</p>
</body>
</html>';
}

function serveFallbackPreview($uniqueId, $error = null) {
    header('Content-Type: text/html; charset=utf-8');
    $eventName = 'Event ' . htmlspecialchars($uniqueId, ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>' . htmlspecialchars($eventName, ENT_QUOTES, 'UTF-8') . ' | STAIRS Talent Hub</title>
    <meta property="og:title" content="' . htmlspecialchars($eventName, ENT_QUOTES, 'UTF-8') . '" />
    <meta property="og:description" content="Join this exciting event on STAIRS Talent Hub" />
    <meta property="og:site_name" content="STAIRS Talent Hub" />
</head>
<body>
    <h1>' . htmlspecialchars($eventName, ENT_QUOTES, 'UTF-8') . '</h1>
    <p>Join this exciting event on STAIRS Talent Hub</p>
</body>
</html>';
}
?>

