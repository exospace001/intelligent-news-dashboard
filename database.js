const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'news.db'));
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Articles table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // RSS sources table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            category TEXT,
            active BOOLEAN DEFAULT 1,
            last_fetched DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // User preferences
        this.db.run(`
          CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            // Insert default RSS sources
            this.insertDefaultSources();
            resolve();
          }
        });
      });
    });
  }

  insertDefaultSources() {
    const sources = [
      { name: 'WordPress.org News', url: 'https://wordpress.org/news/feed/', category: 'WordPress' },
      { name: 'WP Tavern', url: 'https://wptavern.com/feed', category: 'WordPress' },
      { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'Design' },
      { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'Design' },
      { name: 'A List Apart', url: 'https://alistapart.com/main/feed/', category: 'Design' },
      { name: 'GitHub Blog', url: 'https://github.blog/feed/', category: 'Development' }
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO sources (name, url, category) 
      VALUES (?, ?, ?)
    `);

    sources.forEach(source => {
      stmt.run(source.name, source.url, source.category);
    });

    stmt.finalize();
  }

  // Article methods
  addArticle(article) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO articles 
        (title, url, content, source, author, pub_date, read_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        article.title,
        article.url,
        article.content,
        article.source,
        article.author || null,
        article.pubDate,
        article.readTime || 0,
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
      
      stmt.finalize();
    });
  }

  getArticles(filter = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM articles 
        WHERE 1=1
      `;
      const params = [];

      if (filter.unread) {
        sql += ' AND is_read = 0';
      }
      if (filter.saved) {
        sql += ' AND is_saved = 1';
      }
      if (filter.category) {
        sql += ' AND source IN (SELECT name FROM sources WHERE category = ?)';
        params.push(filter.category);
      }

      sql += ' ORDER BY pub_date DESC LIMIT ?';
      params.push(filter.limit || 50);

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  markRead(articleId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE articles SET is_read = 1 WHERE id = ?',
        [articleId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  toggleSaved(articleId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE articles SET is_saved = NOT is_saved WHERE id = ?',
        [articleId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  getSources() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM sources WHERE active = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  updateLastFetched(sourceId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE sources SET last_fetched = CURRENT_TIMESTAMP WHERE id = ?',
        [sourceId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  addSource(source) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO sources (name, url, category, active) 
        VALUES (?, ?, ?, 1)
      `);
      
      stmt.run(source.name, source.url, source.category, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      
      stmt.finalize();
    });
  }
}

module.exports = Database;