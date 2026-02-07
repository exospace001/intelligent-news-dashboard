const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

class RSSFetcher {
  constructor(database) {
    this.db = database;
    this.parser = new Parser({
      timeout: 10000,
      maxRedirects: 5
    });
  }

  // Estimate reading time (words per minute)
  estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  // Create summary (first few sentences or ~150 words max)
  createSummary(content) {
    if (!content || content.length < 100) return content;
    
    // Try to get first 2-3 sentences
    const sentences = content.match(/[^\.!?]+[\.!?]+/g);
    if (sentences && sentences.length >= 2) {
      const firstSentences = sentences.slice(0, 3).join(' ').trim();
      if (firstSentences.length <= 300) {
        return firstSentences;
      }
    }
    
    // Fallback: first ~150 words
    const words = content.split(/\s+/).slice(0, 150);
    return words.join(' ').trim() + '...';
  }

  // Extract clean content from article HTML
  async extractContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'News Dashboard Bot 1.0'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, footer, aside, .advertisement, .ads, .social-share').remove();
      
      // Try to find main content
      let content = '';
      const contentSelectors = [
        'article',
        '.entry-content',
        '.post-content',
        '.article-content',
        '[role="main"]',
        'main'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > 200) {
          content = element.text().trim();
          break;
        }
      }

      // Fallback to body if no content found
      if (!content) {
        content = $('body').text().trim();
      }

      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      // Limit content length
      if (content.length > 5000) {
        content = content.substring(0, 5000) + '...';
      }

      return content;
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error.message);
      return '';
    }
  }

  // Fetch articles from a single RSS source
  async fetchSource(source) {
    try {
      console.log(`Fetching ${source.name}...`);
      
      const feed = await this.parser.parseURL(source.url);
      const articles = [];

      for (const item of feed.items.slice(0, 10)) { // Latest 10 articles
        try {
          // Extract clean content
          const content = await this.extractContent(item.link);
          
          // Create summary (first 2-3 sentences or ~150 words)
          const summary = this.createSummary(content);
          
          const article = {
            title: item.title?.replace(/\s+/g, ' ').trim() || 'Untitled',
            url: item.link,
            content: content,
            summary: summary,
            source: source.name,
            author: item.creator || item.author || null,
            pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            readTime: this.estimateReadingTime(content)
          };

          // Only add if we have meaningful content
          if (article.content && article.content.length > 100) {
            await this.db.addArticle(article);
            articles.push(article);
          }
        } catch (error) {
          console.error(`Error processing article from ${source.name}:`, error.message);
        }
      }

      // Update last fetched time
      await this.db.updateLastFetched(source.id);
      
      console.log(`✅ ${source.name}: ${articles.length} articles processed`);
      return articles;
    } catch (error) {
      console.error(`❌ Error fetching ${source.name}:`, error.message);
      return [];
    }
  }

  // Fetch all active sources
  async fetchAll() {
    console.log('🔄 Starting RSS fetch...');
    const startTime = Date.now();
    
    try {
      const sources = await this.db.getSources();
      const results = [];

      // Process sources sequentially to be respectful
      for (const source of sources) {
        const articles = await this.fetchSource(source);
        results.push(...articles);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ RSS fetch complete: ${results.length} new articles in ${duration}s`);
      
      return results;
    } catch (error) {
      console.error('❌ RSS fetch failed:', error.message);
      return [];
    }
  }

  // Score articles based on content relevance
  scoreArticle(article) {
    const keywords = {
      wordpress: 3,
      design: 2,
      css: 2,
      javascript: 2,
      product: 1,
      management: 1,
      accessibility: 2,
      performance: 2,
      'open source': 2
    };

    let score = 0;
    const text = (article.title + ' ' + article.content).toLowerCase();

    for (const [keyword, weight] of Object.entries(keywords)) {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * weight;
    }

    return Math.min(score, 10); // Cap at 10
  }
}

module.exports = RSSFetcher;