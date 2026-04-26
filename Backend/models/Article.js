const { db } = require('../config/database');
const slugify = require('slugify');

class ArticleModel {
  /**
   * Create a new article
   */
  static create({ title, slug, excerpt, content, coverImage, categoryId, status, metaTitle, metaDescription, featured }) {
    const articleSlug = slug || slugify(title, { lower: true, strict: true });

    const readingTime = this.calculateReadingTime(content);

    const result = db.prepare(`
      INSERT INTO articles (title, slug, excerpt, content, cover_image, category_id, status, meta_title, meta_description, reading_time, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, articleSlug, excerpt, content, coverImage,
      categoryId, status || 'draft', metaTitle, metaDescription,
      readingTime, featured ? 1 : 0
    );

    // Update category article count
    this.updateCategoryCount(categoryId);

    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find article by ID
   */
  static findById(id) {
    const article = db.prepare(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(id);

    if (article) {
      article.featured = Boolean(article.featured);
      article.tags = this.getTags(id);
    }
    return article;
  }

  /**
   * Find article by slug (for public view)
   */
  static findBySlug(slug) {
    const article = db.prepare(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.slug = ? AND a.status = 'published'
    `).get(slug);

    if (article) {
      article.featured = Boolean(article.featured);
      article.tags = this.getTags(article.id);
    }
    return article;
  }

  /**
   * Get all articles (admin view — includes drafts)
   */
  static findAll({ page = 1, limit = 12, status, categoryId, search, featured } = {}) {
    let where = ['1=1'];
    const params = [];

    if (status) { where.push('a.status = ?'); params.push(status); }
    if (categoryId) { where.push('a.category_id = ?'); params.push(categoryId); }
    if (featured !== undefined) { where.push('a.featured = ?'); params.push(featured ? 1 : 0); }
    if (search) {
      where.push('(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = where.join(' AND ');
    const offset = (page - 1) * limit;

    const total = db.prepare(`SELECT COUNT(*) as count FROM articles a WHERE ${whereClause}`).get(...params).count;
    const articles = db.prepare(`
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.status, a.reading_time,
             a.featured, a.views, a.published_at, a.created_at,
             c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    articles.forEach(a => a.featured = Boolean(a.featured));

    return { articles, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get published articles (public view)
   */
  static findPublished({ page = 1, limit = 12, categoryId, search } = {}) {
    return this.findAll({ page, limit, status: 'published', categoryId, search });
  }

  /**
   * Get featured articles
   */
  static findFeatured() {
    return db.prepare(`
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.reading_time,
             a.featured, a.published_at,
             c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published' AND a.featured = 1
      ORDER BY a.published_at DESC
      LIMIT 5
    `).all().map(a => ({ ...a, featured: Boolean(a.featured) }));
  }

  /**
   * Update an article
   */
  static update(id, data) {
    const allowed = ['title', 'slug', 'excerpt', 'content', 'coverImage', 'categoryId',
                     'status', 'metaTitle', 'metaDescription', 'featured'];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (key === 'slug') {
          fields.push('slug = ?');
          values.push(slugify(value, { lower: true, strict: true }));
        } else if (key === 'featured') {
          fields.push('featured = ?');
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${column} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    // Auto-publish date
    if (data.status === 'published') {
      const current = db.prepare('SELECT published_at FROM articles WHERE id = ?').get(id);
      if (!current.published_at) {
        fields.push('published_at = ?');
        values.push(new Date().toISOString());
      }
    }

    // Recalculate reading time if content changed
    if (data.content) {
      fields.push('reading_time = ?');
      values.push(this.calculateReadingTime(data.content));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    if (data.categoryId) this.updateCategoryCount(data.categoryId);
    return this.findById(id);
  }

  /**
   * Delete an article
   */
  static delete(id) {
    const article = this.findById(id);
    if (article) {
      db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(id);
      db.prepare('DELETE FROM analytics WHERE article_id = ?').run(id);
      if (article.category_id) this.updateCategoryCount(article.category_id);
    }
    return db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  }

  /**
   * Increment view count
   */
  static incrementViews(id) {
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(id);
  }

  /**
   * Set article tags
   */
  static setTags(articleId, tags) {
    db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(articleId);
    const insert = db.prepare('INSERT INTO article_tags (article_id, tag) VALUES (?, ?)');
    for (const tag of tags) {
      insert.run(articleId, tag.toLowerCase().trim());
    }
  }

  /**
   * Get article tags
   */
  static getTags(articleId) {
    return db.prepare('SELECT tag FROM article_tags WHERE article_id = ?').all(articleId).map(r => r.tag);
  }

  /**
   * Get all unique tags
   */
  static getAllTags() {
    return db.prepare('SELECT tag, COUNT(*) as count FROM article_tags GROUP BY tag ORDER BY count DESC').all();
  }

  /**
   * Calculate reading time in minutes
   */
  static calculateReadingTime(content) {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  }

  /**
   * Update category article count
   */
  static updateCategoryCount(categoryId) {
    if (!categoryId) return;
    const count = db.prepare('SELECT COUNT(*) as c FROM articles WHERE category_id = ? AND status = ?')
      .get(categoryId, 'published').c;
    db.prepare('UPDATE categories SET article_count = ? WHERE id = ?').run(count, categoryId);
  }

  /**
   * Get stats for admin dashboard
   */
  static getStats() {
    const total = db.prepare('SELECT COUNT(*) as c FROM articles').get().c;
    const published = db.prepare('SELECT COUNT(*) as c FROM articles WHERE status = ?').get('published').c;
    const drafts = db.prepare('SELECT COUNT(*) as c FROM articles WHERE status = ?').get('draft').c;
    const totalViews = db.prepare('SELECT COALESCE(SUM(views), 0) as v FROM articles').get().v;
    return { total, published, drafts, totalViews };
  }
}

module.exports = ArticleModel;