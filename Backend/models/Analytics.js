const { db } = require('../config/database');

class AnalyticsModel {
  static track({ articleId, ip, userAgent }) {
    // Simple flood protection: one view per IP per article per hour
    const recent = db.prepare(`
      SELECT id FROM analytics
      WHERE article_id = ? AND ip_address = ?
      AND visited_at > datetime('now', '-1 hour')
    `).get(articleId, ip);

    if (recent) return false;

    db.prepare(`
      INSERT INTO analytics (article_id, ip_address, user_agent)
      VALUES (?, ?, ?)
    `).run(articleId, ip, userAgent);

    // Increment article view count
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(articleId);
    return true;
  }

  static getArticleStats(articleId, days = 30) {
    return db.prepare(`
      SELECT DATE(visited_at) as date, COUNT(*) as views
      FROM analytics
      WHERE article_id = ? AND visited_at > datetime('now', '-' || ? || ' days')
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `).all(articleId, days);
  }

  static getTopArticles(limit = 10, days = 30) {
    return db.prepare(`
      SELECT a.id, a.title, a.slug, a.views,
             COUNT(an.id) as recent_views
      FROM articles a
      LEFT JOIN analytics an ON an.article_id = a.id
        AND an.visited_at > datetime('now', '-' || ? || ' days')
      WHERE a.status = 'published'
      GROUP BY a.id
      ORDER BY recent_views DESC
      LIMIT ?
    `).all(days, limit);
  }

  static getTotalViews(days = 30) {
    return db.prepare(`
      SELECT COUNT(*) as views FROM analytics
      WHERE visited_at > datetime('now', '-' || ? || ' days')
    `).get(days).views;
  }

  static getDailyViews(days = 30) {
    return db.prepare(`
      SELECT DATE(visited_at) as date, COUNT(*) as views
      FROM analytics
      WHERE visited_at > datetime('now', '-' || ? || ' days')
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `).all(days);
  }

  static cleanup(days = 90) {
    return db.prepare('DELETE FROM analytics WHERE visited_at < datetime("now", "-" || ? || " days")').run(days);
  }
}

module.exports = AnalyticsModel;