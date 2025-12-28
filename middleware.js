// Vercel Edge Middleware for bot detection and routing
// This middleware intercepts requests to /event/:uniqueId and redirects bots to the preview endpoint
export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Only process event pages
  const eventMatch = url.pathname.match(/^\/event\/([^\/]+)$/);
  if (!eventMatch) {
    return; // Not an event page, continue normally
  }
  
  // Check if this is a bot/crawler request
  // Comprehensive list of all major social media crawlers and bots
  // WhatsApp: WhatsApp/2.x or WhatsApp/x.x.x.x  
  // Facebook: facebookexternalhit
  // Twitter: Twitterbot
  // LinkedIn: LinkedInBot
  // Telegram: TelegramBot
  // Pinterest: Pinterestbot
  // Reddit: redditbot
  // And many more...
  const isBot = /bot|crawler|spider|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|SkypeUriPreview|Discordbot|Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|facebook|twitter|linkedin|pinterest|reddit|tumblr|Pinterestbot|redditbot|Applebot|Slack|Line|Kik|Viber|WeChat|Snapchat|TikTok/i.test(userAgent);
  
  if (isBot) {
    const uniqueId = eventMatch[1];
    // Redirect to backend preview endpoint
    const previewUrl = new URL(`/api/events/preview/${uniqueId}`, request.url);
    return Response.redirect(previewUrl, 307);
  }
  
  // Continue with normal request (return undefined to continue)
  return;
}

