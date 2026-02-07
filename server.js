const express = require('express');
const path = require('path');
const cron = require('node-cron');
const Database = require('./database');
const RSSFetcher = require('./rss-fetcher');
const { basicAuth } = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database and fetcher
const db = new Database();
const fetcher = new RSSFetcher(db);

// Wait for database initialization
let dbReady = false;
db.init().then(() => {
  dbReady = true;
  console.log('✅ Database initialized');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
});

// Middleware
app.use(express.json());

// Basic authentication (username: tam, password: news2024)
app.use(basicAuth('tam', 'news2024'));

app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get articles with optional filters
app.get('/api/articles', async (req, res) => {
  try {
    const filter = {
      unread: req.query.unread === 'true',
      saved: req.query.saved === 'true',
      category: req.query.category || null,
      limit: parseInt(req.query.limit) || 50
    };

    const articles = await db.getArticles(filter);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark article as read
app.post('/api/articles/:id/read', async (req, res) => {
  try {
    await db.markRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle article saved status
app.post('/api/articles/:id/save', async (req, res) => {
  try {
    await db.toggleSaved(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get RSS sources
app.get('/api/sources', async (req, res) => {
  try {
    const sources = await db.getSources();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new RSS source
app.post('/api/sources', async (req, res) => {
  try {
    const { url, name, category } = req.body;
    
    if (!url || !name) {
      return res.status(400).json({ error: 'URL and name are required' });
    }
    
    const sourceId = await db.addSource({ url, name, category: category || 'Other' });
    
    // Try to fetch some articles from the new source
    const sources = await db.getSources();
    const newSource = sources.find(s => s.id === sourceId);
    if (newSource) {
      try {
        await fetcher.fetchSource(newSource);
        console.log(`✅ Successfully fetched initial articles from ${name}`);
      } catch (error) {
        console.error(`⚠️ Could not fetch initial articles from ${name}: ${error.message}`);
      }
    }
    
    res.json({ success: true, message: `Feed "${name}" added successfully`, sourceId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual RSS fetch
app.post('/api/fetch', async (req, res) => {
  try {
    const articles = await fetcher.fetchAll();
    res.json({ 
      success: true, 
      message: `Fetched ${articles.length} new articles` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const [total, unread, saved] = await Promise.all([
      db.getArticles({}),
      db.getArticles({ unread: true }),
      db.getArticles({ saved: true })
    ]);

    res.json({
      total: total.length,
      unread: unread.length,
      saved: saved.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Schedule RSS fetching every 4 hours
cron.schedule('0 */4 * * *', async () => {
  if (dbReady) {
    console.log('⏰ Scheduled RSS fetch starting...');
    await fetcher.fetchAll();
  }
});

// Initial fetch on startup
setTimeout(async () => {
  if (dbReady) {
    console.log('🚀 Initial RSS fetch...');
    await fetcher.fetchAll();
  }
}, 5000);

app.listen(port, '0.0.0.0', () => {
  console.log(`📰 News Dashboard running at http://0.0.0.0:${port}`);
  console.log('🌐 Accessible externally for on-the-go reading');
  console.log('🔄 RSS feeds will be fetched every 4 hours');
});

module.exports = app;