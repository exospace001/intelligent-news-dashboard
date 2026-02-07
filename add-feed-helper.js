const Database = require('./news-dashboard/database');
const RSSFetcher = require('./news-dashboard/rss-fetcher');

// Helper function to add feeds via chat
async function addFeedFromChat(url, name, category = 'Other') {
    try {
        const db = new Database();
        await db.init();
        
        const sourceId = await db.addSource({ url, name, category });
        
        // Try to fetch some articles from the new source
        const fetcher = new RSSFetcher(db);
        const sources = await db.getSources();
        const newSource = sources.find(s => s.id === sourceId);
        
        if (newSource) {
            try {
                await fetcher.fetchSource(newSource);
                console.log(`✅ Successfully added "${name}" and fetched initial articles`);
                return { success: true, message: `Feed "${name}" added successfully`, articles: true };
            } catch (error) {
                console.log(`⚠️ Added "${name}" but could not fetch articles: ${error.message}`);
                return { success: true, message: `Feed "${name}" added but could not fetch articles`, articles: false };
            }
        }
        
        return { success: true, message: `Feed "${name}" added successfully` };
    } catch (error) {
        console.error('Error adding feed:', error);
        return { success: false, error: error.message };
    }
}

// Export for use by Exo
module.exports = { addFeedFromChat };

// CLI usage
if (require.main === module) {
    const [, , url, name, category] = process.argv;
    
    if (!url || !name) {
        console.log('Usage: node add-feed-helper.js <url> <name> [category]');
        console.log('Example: node add-feed-helper.js "https://feeds.feedburner.com/oreilly/radar" "O\'Reilly Radar" "Tech"');
        process.exit(1);
    }
    
    addFeedFromChat(url, name, category).then(result => {
        if (result.success) {
            console.log(`✅ ${result.message}`);
        } else {
            console.log(`❌ ${result.error}`);
        }
    });
}