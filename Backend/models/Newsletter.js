const { db } = require('../config/database');

class NewsletterModel {
  static subscribe(email) {
    // Check if already subscribed
    const existing = db.prepare('SELECT id, status FROM newsletter_subscribers WHERE email = ?').get(email);
    if (existing) {
      if (existing.status === 'active') {
        throw new Error('This email is already subscribed.');
      }
      // Reactivate
      db.prepare('UPDATE newsletter_subscribers SET status = ?, subscribed_at = ? WHERE id = ?')
        .run('active', new Date().toISOString(), existing.id);
      return { email, status: 'reactivated' };
    }

    const result = db.prepare(`
      INSERT INTO newsletter_subscribers (email, status)
      VALUES (?, 'active')
    `).run(email);

    return { id: result.lastInsertRowid, email, status: 'subscribed' };
  }

  static unsubscribe(email) {
    const result = db.prepare(
      "UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE email = ? AND status = 'active'"
    ).run(email);
    return result.changes > 0;
  }

  static findAll({ page = 1, limit = 50, status } = {}) {
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const offset = (page - 1) * limit;
    const total = db.prepare(`SELECT COUNT(*) as c FROM newsletter_subscribers WHERE ${where}`).get(...params).c;
    const subscribers = db.prepare(`
      SELECT * FROM newsletter_subscribers WHERE ${where}
      ORDER BY subscribed_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { subscribers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static getActiveCount() {
    return db.prepare("SELECT COUNT(*) as c FROM newsletter_subscribers WHERE status = 'active'").get().c;
  }

  static delete(id) {
    return db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id);
  }
}

module.exports = NewsletterModel;