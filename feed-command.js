// Simple feed management commands for Exo
const { addFeedFromChat } = require('./add-feed-helper');

async function processFeedCommand(message) {
    // Parse different ways users might ask to add feeds
    const patterns = [
        /add (?:this )?rss feed:?\s*(https?:\/\/[^\s]+)(?:\s+(?:named?|called?)\s+[""']?([^""']+)[""']?)?/i,
        /(?:subscribe to|add)\s+(.+?)(?:'s)?\s+(?:rss\s+)?(?:feed|blog)/i,
        /add feed\s+(https?:\/\/[^\s]+)\s*(.+)?/i
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            let url = match[1];
            let name = match[2] || null;
            
            // If no URL found in first group, might be name in first group
            if (!url.startsWith('http')) {
                // This is likely a site name, we need to help find the feed
                return {
                    success: false,
                    error: `I found "${url}" but need the actual RSS feed URL. Try: "Add RSS feed: https://example.com/feed" instead.`
                };
            }
            
            // Clean up name
            if (name) {
                name = name.trim().replace(/^[""']|[""']$/g, '');
            } else {
                // Try to guess name from URL
                try {
                    const urlObj = new URL(url);
                    name = urlObj.hostname.replace('www.', '');
                } catch {
                    name = 'New Feed';
                }
            }
            
            // Guess category from name/URL
            let category = 'Other';
            const nameAndUrl = (name + ' ' + url).toLowerCase();
            if (nameAndUrl.includes('wordpress') || nameAndUrl.includes('wp')) {
                category = 'WordPress';
            } else if (nameAndUrl.includes('css') || nameAndUrl.includes('design') || nameAndUrl.includes('ux') || nameAndUrl.includes('ui')) {
                category = 'Design';
            } else if (nameAndUrl.includes('dev') || nameAndUrl.includes('tech') || nameAndUrl.includes('code') || nameAndUrl.includes('github')) {
                category = 'Development';
            }
            
            // Add the feed
            return await addFeedFromChat(url, name, category);
        }
    }
    
    return null; // No feed command found
}

module.exports = { processFeedCommand };

// Test from command line
if (require.main === module) {
    const testMessage = process.argv[2];
    if (testMessage) {
        processFeedCommand(testMessage).then(result => {
            if (result) {
                console.log(result.success ? `✅ ${result.message}` : `❌ ${result.error}`);
            } else {
                console.log('No feed command detected');
            }
        });
    }
}