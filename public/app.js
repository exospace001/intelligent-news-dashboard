class NewsApp {
    constructor() {
        this.articles = [];
        this.currentFilter = 'all';
        this.currentArticle = null;
        
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.loadStats();
        this.loadArticles();
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    updateThemeToggle(theme) {
        const toggle = document.getElementById('theme-toggle');
        toggle.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Fetch button
        document.getElementById('fetch-btn').addEventListener('click', () => {
            this.fetchFeeds();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Reader close
        document.getElementById('close-reader').addEventListener('click', () => {
            this.closeReader();
        });

        // Article actions in reader
        document.getElementById('save-article').addEventListener('click', () => {
            this.toggleSaved(this.currentArticle.id);
        });

        document.getElementById('share-article').addEventListener('click', () => {
            this.shareArticle();
        });

        // Add feed modal
        document.getElementById('add-feed-btn').addEventListener('click', () => {
            this.openAddFeedModal();
        });

        document.getElementById('cancel-feed').addEventListener('click', () => {
            this.closeAddFeedModal();
        });

        document.getElementById('add-feed-form').addEventListener('submit', (e) => {
            this.handleAddFeed(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeReader();
            } else if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
                this.toggleTheme();
            }
        });
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            document.getElementById('total-count').textContent = stats.total;
            document.getElementById('unread-count').textContent = stats.unread;
            document.getElementById('saved-count').textContent = stats.saved;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadArticles(filter = this.currentFilter) {
        this.showLoading();
        
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') {
                if (filter === 'unread') {
                    params.set('unread', 'true');
                } else if (filter === 'saved') {
                    params.set('saved', 'true');
                } else {
                    params.set('category', filter);
                }
            }

            const response = await fetch(`/api/articles?${params}`);
            this.articles = await response.json();
            
            this.renderArticles();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading articles:', error);
            this.showError('Failed to load articles');
            this.hideLoading();
        }
    }

    renderArticles() {
        const container = document.getElementById('articles');
        const empty = document.getElementById('empty');
        
        if (this.articles.length === 0) {
            container.style.display = 'none';
            empty.classList.remove('hidden');
            return;
        }
        
        empty.classList.add('hidden');
        container.style.display = 'flex';
        
        container.innerHTML = this.articles.map(article => `
            <div class="article ${article.is_read ? 'read' : ''}">
                <h2 class="article-title">${this.escapeHtml(article.title)}</h2>
                <div class="article-meta">
                    <span class="article-source">${article.source}</span>
                    ${article.author ? `<span>by ${article.author}</span>` : ''}
                    <span>${this.formatDate(article.pub_date)}</span>
                    ${article.read_time ? `<span>${article.read_time} min read</span>` : ''}
                </div>
                <p class="article-summary">${this.getSummary(article)}</p>
                <div class="article-actions">
                    <a href="${article.url}" target="_blank" class="read-link">Read article</a>
                    <button class="text-action" onclick="app.toggleSaved(${article.id})" data-saved="${article.is_saved}">
                        ${article.is_saved ? 'Unsave' : 'Save'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    openReader(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return;
        
        this.currentArticle = article;
        
        document.getElementById('reader-title').textContent = article.title;
        document.getElementById('reader-source').textContent = article.source;
        document.getElementById('reader-author').textContent = 
            article.author ? `by ${article.author}` : '';
        document.getElementById('reader-date').textContent = 
            this.formatDate(article.pub_date);
        document.getElementById('reader-time').textContent = 
            article.read_time ? `${article.read_time} min read` : '';
        
        const content = document.getElementById('reader-content');
        content.innerHTML = this.formatContent(article.content);
        
        document.getElementById('reader').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Auto-mark as read
        if (!article.is_read) {
            this.markRead(articleId, false);
        }
        
        // Update save button state
        const saveBtn = document.getElementById('save-article');
        saveBtn.textContent = article.is_saved ? '📌 Saved' : '📌 Save';
    }

    closeReader() {
        document.getElementById('reader').classList.add('hidden');
        document.body.style.overflow = '';
        this.currentArticle = null;
    }

    async markRead(articleId, reload = true) {
        try {
            await fetch(`/api/articles/${articleId}/read`, { method: 'POST' });
            
            if (reload) {
                this.loadStats();
                this.loadArticles();
            } else {
                // Update local state
                const article = this.articles.find(a => a.id === articleId);
                if (article) article.is_read = true;
            }
        } catch (error) {
            console.error('Error marking article as read:', error);
            this.showError('Failed to mark article as read');
        }
    }

    async toggleSaved(articleId) {
        try {
            await fetch(`/api/articles/${articleId}/save`, { method: 'POST' });
            
            this.loadStats();
            this.loadArticles();
            
            if (this.currentArticle && this.currentArticle.id === articleId) {
                this.currentArticle.is_saved = !this.currentArticle.is_saved;
                const saveBtn = document.getElementById('save-article');
                saveBtn.textContent = this.currentArticle.is_saved ? '📌 Saved' : '📌 Save';
            }
            
            this.showStatus(
                this.currentArticle?.is_saved ? 'Article saved!' : 'Article unsaved'
            );
        } catch (error) {
            console.error('Error toggling saved status:', error);
            this.showError('Failed to save article');
        }
    }

    async fetchFeeds() {
        const btn = document.getElementById('fetch-btn');
        const originalText = btn.textContent;
        
        btn.textContent = '⏳';
        btn.disabled = true;
        
        try {
            const response = await fetch('/api/fetch', { method: 'POST' });
            const result = await response.json();
            
            this.loadStats();
            this.loadArticles();
            this.showStatus(result.message);
        } catch (error) {
            console.error('Error fetching feeds:', error);
            this.showError('Failed to fetch feeds');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.loadArticles(filter);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    shareArticle() {
        if (!this.currentArticle) return;
        
        const shareData = {
            title: this.currentArticle.title,
            url: this.currentArticle.url
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(this.currentArticle.url);
            this.showStatus('Article URL copied to clipboard!');
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
        
        return date.toLocaleDateString();
    }

    getSummary(article) {
        // Use the summary field if available, otherwise create preview
        if (article.summary) {
            return article.summary;
        }
        
        if (!article.content) return 'No preview available.';
        
        const words = article.content.split(' ').slice(0, 25);
        const preview = words.join(' ');
        return preview.length < article.content.length ? preview + '...' : preview;
    }

    formatContent(content) {
        if (!content) return '<p>No content available.</p>';
        
        // Simple formatting - split into paragraphs
        const paragraphs = content.split('\n\n')
            .filter(p => p.trim().length > 0)
            .map(p => `<p>${this.escapeHtml(p.trim())}</p>`);
        
        return paragraphs.join('');
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('articles').style.display = 'none';
        document.getElementById('empty').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showStatus(message) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.classList.remove('hidden');
        
        setTimeout(() => {
            status.classList.add('hidden');
        }, 3000);
    }

    showError(message) {
        console.error(message);
        this.showStatus('❌ ' + message);
    }

    openAddFeedModal() {
        document.getElementById('add-feed-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeAddFeedModal() {
        document.getElementById('add-feed-modal').classList.add('hidden');
        document.body.style.overflow = '';
        document.getElementById('add-feed-form').reset();
    }

    async handleAddFeed(event) {
        event.preventDefault();
        
        const url = document.getElementById('feed-url').value.trim();
        const name = document.getElementById('feed-name').value.trim();
        const category = document.getElementById('feed-category').value;
        
        if (!url || !name) {
            this.showError('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, name, category })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showStatus(`✅ Feed "${name}" added successfully`);
                this.closeAddFeedModal();
                // Refresh articles to show new content
                setTimeout(() => this.fetchFeeds(), 1000);
            } else {
                this.showError(result.error || 'Failed to add feed');
            }
        } catch (error) {
            this.showError('Failed to add feed: ' + error.message);
        }
    }
}

// Initialize app
const app = new NewsApp();