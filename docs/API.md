# API Documentation

## Authentication

All API endpoints require Basic HTTP Authentication.

**Credentials:**
- Username: `tam`
- Password: `news2024`

**Example:**
```bash
curl -u tam:news2024 http://localhost:3000/api/articles
```

## Base URL

```
http://localhost:3000/api
```

## Articles Endpoints

### GET /api/articles

Retrieve filtered list of articles.

**Query Parameters:**
- `unread` (boolean): Show only unread articles
- `saved` (boolean): Show only saved articles  
- `category` (string): Filter by category (WordPress, Design, Development, Other)
- `limit` (number): Maximum articles to return (default: 50)

**Examples:**
```bash
# Get all articles
curl -u tam:news2024 http://localhost:3000/api/articles

# Get unread articles only
curl -u tam:news2024 http://localhost:3000/api/articles?unread=true

# Get WordPress articles
curl -u tam:news2024 http://localhost:3000/api/articles?category=WordPress

# Get 20 saved articles
curl -u tam:news2024 http://localhost:3000/api/articles?saved=true&limit=20
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "WordPress 6.9.1 Maintenance Release",
    "url": "https://wordpress.org/news/2026/02/wordpress-6-9-1/",
    "content": "Full article content...",
    "summary": "WordPress 6.9.1 is now available. This maintenance release...",
    "source": "WordPress.org News", 
    "author": "WordPress Team",
    "pub_date": "2026-02-03T12:00:00Z",
    "read_time": 3,
    "is_read": false,
    "is_saved": false,
    "created_at": "2026-02-07T21:00:00Z"
  }
]
```

### POST /api/articles/:id/read

Mark an article as read.

**Parameters:**
- `id` (number): Article ID

**Example:**
```bash
curl -u tam:news2024 -X POST http://localhost:3000/api/articles/123/read
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/articles/:id/save

Toggle saved status of an article.

**Parameters:**
- `id` (number): Article ID

**Example:**
```bash
curl -u tam:news2024 -X POST http://localhost:3000/api/articles/123/save
```

**Response:**
```json
{
  "success": true
}
```

## Sources Endpoints

### GET /api/sources

Retrieve list of RSS sources.

**Example:**
```bash
curl -u tam:news2024 http://localhost:3000/api/sources
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "WordPress.org News",
    "url": "https://wordpress.org/news/feed/",
    "category": "WordPress", 
    "active": true,
    "last_fetched": "2026-02-07T20:00:00Z",
    "created_at": "2026-02-07T10:00:00Z"
  }
]
```

### POST /api/sources

Add a new RSS source.

**Body Parameters:**
- `url` (string, required): RSS feed URL
- `name` (string, required): Display name for the source
- `category` (string, optional): Category (WordPress, Design, Development, Other)

**Example:**
```bash
curl -u tam:news2024 -X POST http://localhost:3000/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://css-tricks.com/feed/",
    "name": "CSS-Tricks",
    "category": "Design"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Feed \"CSS-Tricks\" added successfully",
  "sourceId": 7
}
```

## Management Endpoints

### GET /api/stats

Get dashboard statistics.

**Example:**
```bash
curl -u tam:news2024 http://localhost:3000/api/stats
```

**Response:**
```json
{
  "total": 60,
  "unread": 45,
  "saved": 12
}
```

### POST /api/fetch

Manually trigger RSS feed refresh.

**Example:**
```bash
curl -u tam:news2024 -X POST http://localhost:3000/api/fetch
```

**Response:**
```json
{
  "success": true,
  "message": "Fetched 15 new articles"
}
```

## Error Responses

### Authentication Error
**Status:** 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### Validation Error  
**Status:** 400 Bad Request
```json
{
  "error": "URL and name are required"
}
```

### Server Error
**Status:** 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

## Rate Limiting

- No explicit rate limiting implemented
- RSS fetching is internally rate-limited (1 second between sources)
- Manual refresh requests are not limited

## CORS

CORS is not enabled by default. For cross-origin requests, add CORS middleware:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
```

## Webhooks

No webhook support currently implemented.

## Pagination

Pagination is simple limit-based:
- Use `limit` parameter to control page size
- No offset parameter (chronological ordering only)
- Consider using `pub_date` for cursor-based pagination

## Data Types

### Article Object
```typescript
interface Article {
  id: number;
  title: string;
  url: string;
  content: string;
  summary: string;
  source: string;
  author: string | null;
  pub_date: string;      // ISO 8601 date
  read_time: number;     // Minutes
  is_read: boolean;
  is_saved: boolean;
  created_at: string;    // ISO 8601 date
}
```

### Source Object
```typescript
interface Source {
  id: number;
  name: string;
  url: string;
  category: string;
  active: boolean;
  last_fetched: string | null;  // ISO 8601 date
  created_at: string;           // ISO 8601 date
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
class NewsAPI {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl;
    this.auth = Buffer.from(`${username}:${password}`).toString('base64');
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getArticles(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/articles?${params}`);
  }

  async addSource(source) {
    return this.request('/sources', {
      method: 'POST',
      body: JSON.stringify(source)
    });
  }

  async markRead(articleId) {
    return this.request(`/articles/${articleId}/read`, {
      method: 'POST'
    });
  }
}

// Usage
const api = new NewsAPI('http://localhost:3000/api', 'tam', 'news2024');
const articles = await api.getArticles({ category: 'WordPress' });
```

### Python
```python
import requests
from requests.auth import HTTPBasicAuth

class NewsAPI:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.auth = HTTPBasicAuth(username, password)
    
    def get_articles(self, **filters):
        response = requests.get(
            f"{self.base_url}/articles",
            auth=self.auth,
            params=filters
        )
        response.raise_for_status()
        return response.json()
    
    def add_source(self, url, name, category=None):
        data = {"url": url, "name": name}
        if category:
            data["category"] = category
            
        response = requests.post(
            f"{self.base_url}/sources",
            auth=self.auth,
            json=data
        )
        response.raise_for_status()
        return response.json()

# Usage
api = NewsAPI('http://localhost:3000/api', 'tam', 'news2024')
articles = api.get_articles(category='WordPress', unread=True)
```

### cURL Examples

**Get unread WordPress articles:**
```bash
curl -u tam:news2024 \
  "http://localhost:3000/api/articles?category=WordPress&unread=true"
```

**Add new feed:**
```bash
curl -u tam:news2024 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/feed","name":"Example Blog","category":"Development"}' \
  http://localhost:3000/api/sources
```

**Mark article as read:**
```bash
curl -u tam:news2024 \
  -X POST \
  http://localhost:3000/api/articles/123/read
```

**Get dashboard stats:**
```bash
curl -u tam:news2024 \
  http://localhost:3000/api/stats
```

**Manual refresh:**
```bash
curl -u tam:news2024 \
  -X POST \
  http://localhost:3000/api/fetch
```