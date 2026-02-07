# Technical Documentation

## Architecture Deep Dive

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
├─────────────────────────────────────────────────────────────┤
│  HTML + CSS + Vanilla JS                                   │
│  • Article rendering & interaction                          │
│  • Theme management                                         │
│  • Feed management UI                                       │
│  • Authentication handling                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                        │
├─────────────────────────────────────────────────────────────┤
│  • Basic Auth middleware                                   │
│  • REST API endpoints                                      │  
│  • Static file serving                                     │
│  • CORS handling                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   RSS Fetcher Engine                       │
├─────────────────────────────────────────────────────────────┤
│  • RSS parsing (rss-parser)                               │
│  • Content extraction (Axios + Cheerio)                   │
│  • Text processing & summarization                        │
│  • Duplicate detection                                    │
│  • Error handling & retries                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                          │
├─────────────────────────────────────────────────────────────┤
│  • articles table (content storage)                       │
│  • sources table (RSS feed management)                    │
│  • preferences table (user settings)                      │
│  • Automatic indexing & optimization                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cron Scheduler                          │
├─────────────────────────────────────────────────────────────┤
│  • Automated RSS fetching (4-hour intervals)              │
│  • Database maintenance                                   │
│  • Error logging & recovery                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Article Fetching Process
1. **Cron Trigger**: Every 4 hours or manual refresh
2. **Source Loading**: Get active RSS sources from database
3. **RSS Parsing**: Parse RSS/XML feeds using rss-parser
4. **Content Extraction**: Fetch full article content via Axios
5. **Content Cleaning**: Remove navigation, ads, scripts using Cheerio
6. **Summary Generation**: Extract first 2-3 sentences or ~150 words
7. **Reading Time**: Calculate based on 200 words per minute
8. **Deduplication**: Check URL against existing articles
9. **Database Storage**: Insert new articles with metadata
10. **Error Handling**: Log failed feeds, continue processing

#### User Interaction Flow
1. **Authentication**: Basic HTTP auth on all requests
2. **Article Loading**: REST API call to `/api/articles` with filters
3. **Rendering**: JavaScript builds article list dynamically  
4. **User Actions**: Save/unsave, mark read, filter categories
5. **State Management**: Local updates + API calls for persistence

### Database Design

#### Articles Table
```sql
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,          -- Deduplication key
    content TEXT,                      -- Full extracted content
    summary TEXT,                      -- Generated summary
    source TEXT NOT NULL,              -- RSS source name
    author TEXT,                       -- Article author
    pub_date DATETIME,                 -- Publication date
    read_time INTEGER,                 -- Estimated reading minutes
    is_read BOOLEAN DEFAULT 0,         -- User read status
    is_saved BOOLEAN DEFAULT 0,        -- User save status
    score REAL DEFAULT 0,              -- Relevance score (future use)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_articles_url ON articles(url);
CREATE INDEX idx_articles_pub_date ON articles(pub_date);
CREATE INDEX idx_articles_source ON articles(source);
CREATE INDEX idx_articles_read ON articles(is_read);
CREATE INDEX idx_articles_saved ON articles(is_saved);
```

#### Sources Table
```sql
CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                -- Display name
    url TEXT UNIQUE NOT NULL,          -- RSS feed URL
    category TEXT,                     -- WordPress/Design/Development/Other
    active BOOLEAN DEFAULT 1,         -- Enable/disable fetching
    last_fetched DATETIME,             -- Last successful fetch
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sources_active ON sources(active);
CREATE INDEX idx_sources_category ON sources(category);
```

#### Preferences Table
```sql
CREATE TABLE preferences (
    key TEXT PRIMARY KEY,              -- Setting name
    value TEXT,                        -- Setting value (JSON)
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Content Processing

#### RSS Parsing Strategy
```javascript
// Parse RSS feed with robust error handling
async fetchSource(source) {
  try {
    const feed = await this.parser.parseURL(source.url);
    const articles = [];

    for (const item of feed.items.slice(0, 10)) { // Latest 10 only
      const content = await this.extractContent(item.link);
      
      if (content && content.length > 100) { // Minimum content threshold
        const article = {
          title: this.cleanTitle(item.title),
          url: item.link,
          content: this.limitContent(content),
          summary: this.createSummary(content),
          source: source.name,
          author: item.creator || item.author,
          pubDate: this.parseDate(item.pubDate),
          readTime: this.estimateReadingTime(content)
        };
        
        await this.db.addArticle(article);
        articles.push(article);
      }
    }
    
    await this.db.updateLastFetched(source.id);
    return articles;
  } catch (error) {
    console.error(`Failed to fetch ${source.name}: ${error.message}`);
    return [];
  }
}
```

#### Content Extraction
```javascript
// Extract clean content from article HTML
async extractContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'News Dashboard Bot 1.0' }
    });

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, footer, aside, .advertisement, .ads').remove();
    
    // Try multiple content selectors
    const selectors = ['article', '.entry-content', '.post-content', 
                      '.article-content', '[role="main"]', 'main'];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        return this.cleanText(element.text());
      }
    }
    
    // Fallback to body
    return this.cleanText($('body').text());
  } catch (error) {
    console.error(`Content extraction failed: ${error.message}`);
    return '';
  }
}
```

#### Summary Generation
```javascript
createSummary(content) {
  if (!content || content.length < 100) return content;
  
  // Try to extract first 2-3 complete sentences
  const sentences = content.match(/[^\.!?]+[\.!?]+/g);
  if (sentences && sentences.length >= 2) {
    const summary = sentences.slice(0, 3).join(' ').trim();
    if (summary.length <= 300) return summary;
  }
  
  // Fallback: first ~150 words with ellipsis
  const words = content.split(/\s+/).slice(0, 150);
  return words.join(' ').trim() + '...';
}
```

### API Design

#### Authentication Middleware
```javascript
const basicAuth = (username, password) => {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="News Dashboard"');
      return res.status(401).send('Authentication required');
    }
    
    const credentials = Buffer.from(auth.substring(6), 'base64')
                             .toString('ascii').split(':');
    
    if (credentials[0] === username && credentials[1] === password) {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="News Dashboard"');
      return res.status(401).send('Invalid credentials');
    }
  };
};
```

#### REST Endpoints
```javascript
// GET /api/articles - Filtered article list
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

// POST /api/sources - Add new RSS source
app.post('/api/sources', async (req, res) => {
  try {
    const { url, name, category } = req.body;
    
    if (!url || !name) {
      return res.status(400).json({ error: 'URL and name required' });
    }
    
    const sourceId = await db.addSource({ url, name, category });
    
    // Test fetch initial articles
    const sources = await db.getSources();
    const newSource = sources.find(s => s.id === sourceId);
    
    if (newSource) {
      try {
        await fetcher.fetchSource(newSource);
      } catch (fetchError) {
        console.warn(`Initial fetch failed: ${fetchError.message}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Feed "${name}" added successfully`,
      sourceId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend Architecture

#### Component Structure
```javascript
class NewsApp {
  constructor() {
    this.articles = [];
    this.currentFilter = 'all';
    this.currentArticle = null;
    this.init();
  }

  async init() {
    this.setupTheme();           // Dark/light mode
    this.setupEventListeners();  // UI interactions
    this.loadStats();            // Article counts
    this.loadArticles();         // Initial article load
  }
  
  // Theme management with localStorage persistence
  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggle(savedTheme);
  }
  
  // Event delegation and keyboard shortcuts
  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').onclick = () => this.toggleTheme();
    
    // Feed management
    document.getElementById('add-feed-btn').onclick = () => this.openAddFeedModal();
    
    // Keyboard shortcuts
    document.onkeydown = (e) => {
      if (e.key === 'Escape') this.closeReader();
      if (e.key === 'd' && !e.ctrlKey) this.toggleTheme();
    };
  }
}
```

#### Article Rendering
```javascript
renderArticles() {
  const container = document.getElementById('articles');
  
  if (this.articles.length === 0) {
    container.innerHTML = '<div class="empty">No articles found</div>';
    return;
  }
  
  container.innerHTML = this.articles.map(article => `
    <div class="article ${article.is_read ? 'read' : ''}">
      <h2 class="article-title">${this.escapeHtml(article.title)}</h2>
      <div class="article-meta">
        <span class="article-source">${article.source}</span>
        <span>${this.formatDate(article.pub_date)}</span>
        <span>${article.read_time} min read</span>
      </div>
      <p class="article-summary">${this.getSummary(article)}</p>
      <div class="article-actions">
        <a href="${article.url}" target="_blank">Read article</a>
        <button onclick="app.toggleSaved(${article.id})">
          ${article.is_saved ? 'Unsave' : 'Save'}
        </button>
      </div>
    </div>
  `).join('');
}
```

### Performance Optimizations

#### Database Indexing
```sql
-- Critical indexes for fast queries
CREATE INDEX idx_articles_pub_date_desc ON articles(pub_date DESC);
CREATE INDEX idx_articles_source_date ON articles(source, pub_date DESC);
CREATE INDEX idx_articles_read_saved ON articles(is_read, is_saved);
```

#### Content Limitations
```javascript
// Limit content size to prevent memory issues
limitContent(content) {
  if (content.length > 5000) {
    return content.substring(0, 5000) + '...';
  }
  return content;
}

// Limit number of articles per fetch
for (const item of feed.items.slice(0, 10)) {
  // Process only latest 10 articles per feed
}
```

#### Request Optimization
```javascript
// Batch database operations
const stmt = this.db.prepare('INSERT OR REPLACE INTO articles ...');
articles.forEach(article => stmt.run(...values));
stmt.finalize();

// Parallel processing with limits
const sources = await db.getSources();
for (const source of sources) {
  await fetcher.fetchSource(source);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
}
```

### Error Handling

#### Database Error Recovery
```javascript
class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'news.db'));
    
    // Handle database errors gracefully
    this.db.on('error', (error) => {
      console.error('Database error:', error);
      // Attempt recovery or graceful shutdown
    });
  }
  
  async safeQuery(sql, params) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          resolve([]); // Return empty result instead of crashing
        } else {
          resolve(rows);
        }
      });
    });
  }
}
```

#### RSS Feed Error Handling
```javascript
async fetchSource(source) {
  try {
    const feed = await this.parser.parseURL(source.url);
    // ... processing
  } catch (error) {
    // Log error but don't crash the entire fetch process
    console.error(`❌ ${source.name}: ${error.message}`);
    
    // Different handling for different error types
    if (error.code === 'ETIMEDOUT') {
      console.log(`⏱️ ${source.name}: Timeout, will retry later`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`🔍 ${source.name}: Feed not found, check URL`);
    }
    
    return []; // Return empty array to continue processing other feeds
  }
}
```

### Security Implementation

#### Input Sanitization
```javascript
// Sanitize all user inputs
escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

cleanTitle(title) {
  return title?.replace(/\s+/g, ' ').trim() || 'Untitled';
}

validateUrl(url) {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}
```

#### Content Security
```javascript
// Remove potentially dangerous content
cleanContent($) {
  // Remove scripts, styles, and dangerous elements
  $('script, style, iframe, object, embed, form').remove();
  
  // Remove event handlers
  $('*').each(function() {
    const element = $(this);
    const attributes = element.get(0).attributes;
    
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attr = attributes[i];
      if (attr.name.startsWith('on')) {
        element.removeAttr(attr.name);
      }
    }
  });
}
```

### Deployment Considerations

#### Environment Configuration
```javascript
// server.js environment setup
const config = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || './news.db',
  fetchInterval: parseInt(process.env.FETCH_INTERVAL) || 4,
  authUser: process.env.AUTH_USER || 'tam',
  authPass: process.env.AUTH_PASS || 'news2024'
};
```

#### Process Management
```bash
# Production process management with PM2
npm install -g pm2

# Create ecosystem file
module.exports = {
  apps: [{
    name: 'news-dashboard',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Monitoring & Logging

#### Application Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage in RSS fetcher
logger.info('RSS fetch started', { sources: sources.length });
logger.error('RSS fetch failed', { source: source.name, error: error.message });
```

#### Health Monitoring
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    articles: await db.getArticleCount(),
    sources: await db.getSourceCount()
  });
});
```