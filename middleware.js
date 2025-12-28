// Vercel Edge Middleware for bot detection and routing
// This middleware intercepts requests to /event/:uniqueId and redirects bots to the preview endpoint
export default function middleware(request) {
  try {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const pathname = url.pathname;
    
    // Only process event pages - match /event/{uniqueId} pattern
    const eventMatch = pathname.match(/^\/event\/([^\/\?]+)/);
    if (!eventMatch) {
      return; // Not an event page, continue normally
    }
    
    const uniqueId = eventMatch[1];
    
    // Comprehensive bot detection pattern
    // Matches all major social media crawlers and bots
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'facebookexternalhit', 'facebookcatalog',
      'Twitterbot', 'Twitter',
      'LinkedInBot', 'LinkedIn',
      'WhatsApp', 'whatsapp',
      'Slackbot', 'Slack',
      'TelegramBot', 'Telegram',
      'SkypeUriPreview',
      'Discordbot', 'Discord',
      'Googlebot', 'Google',
      'Bingbot', 'Bing',
      'Slurp', // Yahoo
      'DuckDuckBot',
      'Baiduspider',
      'YandexBot',
      'Sogou',
      'Exabot',
      'facebot',
      'ia_archiver', // Wayback Machine
      'Pinterestbot', 'Pinterest',
      'redditbot', 'reddit',
      'Applebot',
      'Line',
      'Kik',
      'Viber',
      'WeChat',
      'Snapchat',
      'TikTok',
      'PostmanRuntime', // For testing
      'curl', // For testing
      'wget' // For testing
    ];
    
    const isBot = botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isBot) {
      // Redirect to backend preview endpoint
      const previewPath = `/api/events/preview/${encodeURIComponent(uniqueId)}`;
      const previewUrl = new URL(previewPath, request.url);
      return Response.redirect(previewUrl, 307);
    }
    
    // Continue with normal request
    return;
  } catch (error) {
    // If middleware fails, allow request to continue normally
    console.error('[Middleware Error]:', error);
    return;
  }
}
