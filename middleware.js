// Vercel Edge Middleware for bot detection and routing
// This middleware intercepts ALL requests and redirects bots accessing event pages to the preview endpoint
// IMPORTANT: This runs BEFORE routes, so it can intercept bot requests before static files are served

export default function middleware(request) {
  try {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const pathname = url.pathname;
    
    // Only process event pages - match /event/{uniqueId} pattern
    const eventMatch = pathname.match(/^\/event\/([^\/\?]+)/);
    if (!eventMatch) {
      // Not an event page, continue normally
      return;
    }
    
    const uniqueId = eventMatch[1];
    
    // Comprehensive bot detection - check for ANY bot indicator
    const userAgentLower = userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'facebookexternalhit', 'facebookcatalog',
      'twitterbot', 'twitter',
      'linkedinbot', 'linkedin',
      'whatsapp',
      'slackbot', 'slack',
      'telegrambot', 'telegram',
      'skypeuripreview',
      'discordbot', 'discord',
      'googlebot', 'google',
      'bingbot', 'bing',
      'slurp',
      'duckduckbot',
      'baiduspider',
      'yandexbot',
      'sogou',
      'exabot',
      'facebot',
      'ia_archiver',
      'pinterestbot', 'pinterest',
      'redditbot', 'reddit',
      'applebot',
      'line',
      'kik',
      'viber',
      'wechat',
      'snapchat',
      'tiktok',
      'postmanruntime',
      'curl',
      'wget',
      'axios',
      'node-fetch'
    ];
    
    const isBot = botPatterns.some(pattern => userAgentLower.includes(pattern));
    
    if (isBot && uniqueId) {
      // Redirect bot to backend preview endpoint
      const baseUrl = url.origin;
      const previewPath = `/api/events/preview/${encodeURIComponent(uniqueId)}`;
      const previewUrl = `${baseUrl}${previewPath}`;
      
      // Return redirect response
      return Response.redirect(previewUrl, 307);
    }
    
    // Continue with normal request for non-bots
    return;
  } catch (error) {
    // If middleware fails, allow request to continue normally
    console.error('[Middleware Error]:', error.message);
    return;
  }
}

// Export config to specify which paths to run middleware on
export const config = {
  matcher: [
    '/event/:path*',
    // Optional: Add other paths if needed
  ],
};
