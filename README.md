# 📰 Intelligent News Dashboard

**A minimal, Instapaper-inspired RSS aggregation system built for clean reading and intelligent curation.**

## Overview

This is a personal news dashboard that aggregates RSS feeds into a clean, distraction-free reading experience. Built with simplicity, performance, and reading-focused design as core principles.

## Key Features

### 🎨 **Minimal Design**
- Instapaper-inspired clean interface
- Typography-focused (Georgia/Liberation Serif)
- No icons, no colors, no distractions
- Device-adaptive responsive design
- 100% open source design stack

### 📰 **Smart Content Management**
- RSS feed aggregation from multiple sources
- Intelligent article summaries (2-3 sentences)
- Reading time estimation
- Duplicate detection and cleanup
- Content extraction and sanitization

### ⚙️ **Feed Management**
- Add feeds via web interface
- Add feeds via natural language commands
- Auto-categorization (WordPress, Design, Development)
- Manual category assignment
- Active/inactive feed management

### 🔐 **Security & Privacy**
- Basic HTTP authentication
- Local SQLite database (no external services)
- All processing done locally
- No tracking, no analytics
- Password-protected access

### 📱 **Device Optimization**
- Adaptive layout for all screen sizes
- Optimized typography scaling
- Touch-friendly interface
- Keyboard shortcuts
- Dark/light mode support

## Architecture

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **RSS Parsing**: rss-parser
- **Content Extraction**: Cheerio + Axios
- **Scheduling**: node-cron

### Frontend
- **JavaScript**: Vanilla ES6+
- **Styling**: Pure CSS with custom properties
- **Fonts**: Georgia, Times New Roman, Liberation Serif
- **Icons**: None (text-based interface)
- **Dependencies**: Zero external UI frameworks

### Data Flow
```
RSS Sources → Fetch Engine → Content Processing → SQLite → REST API → Frontend
```

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Quick Start
```bash
# Clone or extract the project
cd news-dashboard

# Install dependencies  
npm install

# Start the server
npm start

# Access at http://localhost:3000
# Default auth: tam / news2024
```

### Docker Deployment
```bash
# Build image
docker build -t news-dashboard .

# Run with port mapping
docker run -p 3000:3000 news-dashboard
```

### Environment Variables
```bash
PORT=3000                    # Server port
DB_PATH=./news.db           # SQLite database path
FETCH_INTERVAL=4            # RSS fetch interval (hours)
```

## Usage

### Adding RSS Feeds

**Via Web Interface:**
1. Click "Add Feed" in the filter bar
2. Enter RSS URL and feed name
3. Select category
4. Click "Add Feed"

**Via Natural Language:**
Send any of these commands:
- "Add RSS feed: https://example.com/feed"
- "Subscribe to TechCrunch's feed"  
- "Add feed https://css-tricks.com/feed named CSS Tricks"

### Reading Articles
- Browse articles in the main feed
- Filter by: All, Unread, Saved, WordPress, Design, Development
- Click "Read article" to open original source
- Click "Save" to bookmark for later
- Auto-marking as read when opened

### Interface Controls
- **Dark/Light**: Toggle theme
- **Refresh**: Manual feed update
- **Filters**: Category-based article filtering
- **Save/Unsave**: Bookmark management

### Keyboard Shortcuts
- `Esc` - Close article reader
- `d` - Toggle dark/light mode

## API Reference

### Authentication
All endpoints require Basic Auth:
```bash
curl -u tam:news2024 http://localhost:3000/api/articles
```

### Endpoints

**Articles**
```bash
GET  /api/articles              # Get filtered articles
POST /api/articles/:id/read     # Mark article as read
POST /api/articles/:id/save     # Toggle saved status
```

**RSS Sources**
```bash
GET  /api/sources               # List RSS sources
POST /api/sources               # Add new RSS source
```

**Management**
```bash
GET  /api/stats                 # Dashboard statistics
POST /api/fetch                 # Manual RSS refresh
```

**Query Parameters for `/api/articles`:**
- `unread=true` - Show only unread articles
- `saved=true` - Show only saved articles  
- `category=WordPress` - Filter by category
- `limit=50` - Limit number of results

## Default RSS Sources

### WordPress Ecosystem
- WordPress.org News: `https://wordpress.org/news/feed/`
- WP Tavern: `https://wptavern.com/feed`

### Design & Development  
- CSS-Tricks: `https://css-tricks.com/feed/`
- Smashing Magazine: `https://www.smashingmagazine.com/feed/`
- A List Apart: `https://alistapart.com/main/feed/`

### Development
- GitHub Blog: `https://github.blog/feed/`

## Configuration

### Database Schema
```sql
-- Articles table
CREATE TABLE articles (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    content TEXT,
    summary TEXT,
    source TEXT NOT NULL,
    author TEXT,
    pub_date DATETIME,
    read_time INTEGER,
    is_read BOOLEAN DEFAULT 0,
    is_saved BOOLEAN DEFAULT 0,
    score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RSS Sources table  
CREATE TABLE sources (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    category TEXT,
    active BOOLEAN DEFAULT 1,
    last_fetched DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Content Processing
- **Summary Generation**: Extracts first 2-3 sentences or ~150 words
- **Reading Time**: Calculated at 200 words per minute
- **Content Cleaning**: Removes ads, navigation, scripts
- **Duplicate Detection**: By URL comparison
- **Error Handling**: Failed feeds don't break system

## Design System

### Typography
```css
/* Primary Font Stack (Open Source) */
font-family: Georgia, 'Times New Roman', 'Liberation Serif', serif;

/* Font Sizes (Device Adaptive) */
Desktop (1200px+):  19px base, 1.375rem headlines
Laptop (992-1199px): 18px base, 1.25rem headlines  
Tablet (768-991px):  17px base, 1.25rem headlines
Portrait (576-767px): 16px base, 1.125rem headlines
Mobile (<576px):     16px base, 1.125rem headlines
```

### Color Palette
```css
/* Light Mode */
--bg-primary: #ffffff
--bg-secondary: #f8f9fa  
--bg-tertiary: #e9ecef
--text-primary: #212529
--text-secondary: #6c757d
--text-muted: #adb5bd
--border: #dee2e6

/* Dark Mode */  
--bg-primary: #0f0f0f
--bg-secondary: #1a1a1a
--bg-tertiary: #2a2a2a
--text-primary: #e8e8e8
--text-secondary: #a0a0a0
--text-muted: #707070
--border: #333333
```

### Spacing System
```css
--space-xs: 0.25rem    /* 4px */
--space-sm: 0.5rem     /* 8px */  
--space-md: 1rem       /* 16px */
--space-lg: 1.5rem     /* 24px */
--space-xl: 2rem       /* 32px */
--space-2xl: 3rem      /* 48px */
```

### Layout Constraints
```css
/* Device-Adaptive Max Widths */
Desktop (1200px+):    800px max-width
Laptop (992-1199px):  750px or 90vw  
Tablet (768-991px):   700px or 95vw
Portrait (576-767px): 95vw
Mobile (<576px):      98vw
```

## Performance

### Benchmarks
- **Initial Load**: ~2-3 seconds (60 articles)
- **RSS Fetch**: ~13-16 seconds (6 sources)
- **Database Size**: ~1MB per 1000 articles
- **Memory Usage**: ~50MB Node.js process
- **Bundle Size**: Zero external dependencies

### Optimization Features
- **Scheduled Fetching**: Every 4 hours (configurable)
- **Content Limiting**: ~5000 chars per article
- **Database Indexing**: URL and date indexes
- **Lazy Loading**: Articles loaded on-demand
- **Content Compression**: Gzipped responses

## Development

### Project Structure
```
news-dashboard/
├── server.js              # Express server
├── database.js            # SQLite operations  
├── rss-fetcher.js         # RSS processing
├── auth.js               # Authentication
├── public/
│   ├── index.html        # Main interface
│   ├── styles.css        # Styling
│   └── app.js           # Frontend logic
├── node_modules/         # Dependencies
└── package.json         # Project config
```

### Adding New Features

**RSS Processing:**
Edit `rss-fetcher.js` to modify content extraction, scoring, or summarization.

**Database Schema:**  
Edit `database.js` to add new tables or modify existing structure.

**API Endpoints:**
Edit `server.js` to add new routes or modify existing ones.

**Frontend Interface:**
Edit `public/app.js` for functionality, `public/styles.css` for design.

### Testing RSS Feeds
```bash
# Test single feed
node rss-fetcher.js "https://example.com/feed"

# Add feed via CLI
node add-feed-helper.js "https://example.com/feed" "Feed Name" "Category"

# Test feed command parsing
node feed-command.js "Add RSS feed: https://example.com/feed"
```

## Security Considerations

### Authentication
- Basic HTTP auth (configurable credentials)
- All API endpoints protected
- No session management (stateless)

### Data Privacy
- All data stored locally (SQLite)
- No external service dependencies
- No tracking or analytics
- Content cached locally only

### Content Security
- HTML content sanitized (Cheerio)
- External scripts removed
- Safe content extraction only
- No eval() or unsafe operations

### Network Security  
- HTTPS support ready
- Configurable binding (localhost/all interfaces)
- Rate limiting on RSS fetches
- Timeout protection on HTTP requests

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill existing process
pkill -f "node server.js"

# Or use different port
PORT=3001 npm start
```

**RSS Feed Not Loading:**
- Check feed URL validity
- Verify feed returns valid XML/RSS
- Check network connectivity
- Look for CORS restrictions

**Database Locked:**
```bash
# Stop server and restart
npm stop
npm start
```

**Authentication Not Working:**
- Verify username/password in server.js
- Check Basic Auth header format
- Clear browser auth cache

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Database debugging
sqlite3 news.db ".schema"
sqlite3 news.db "SELECT COUNT(*) FROM articles;"
```

## Contributing

### Code Style
- Use 2 spaces for indentation
- Semicolons required  
- ES6+ features preferred
- Comments for complex logic

### Adding RSS Sources
1. Test feed manually first
2. Add via web interface  
3. Verify content extraction
4. Check for duplicates
5. Update documentation

## License

MIT License - See LICENSE file for details.

## Credits

- **Design Inspiration**: Instapaper
- **Typography**: Georgia (Microsoft), Liberation Serif (Red Hat)
- **RSS Parsing**: rss-parser library
- **Database**: SQLite3
- **Built for**: Tam (@Karmatosed)
- **Built by**: Exo 🌊

---

**"Simple foundation, intelligent evolution"** 

A reading-focused news system that prioritizes content over features.