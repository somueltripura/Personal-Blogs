const { db } = require('../config/database');

class ContactModel {
  static create({ name, email, message }) {
    const result = db.prepare(`
      INSERT INTO contact_messages (name, email, message)
      VALUES (?, ?, ?)
    `).run(name, email, message);
    return { id: result.lastInsertRowid, name, email };
  }

  static findAll({ page = 1, limit = 20, isRead } = {}) {
    let where = '1=1';
    const params = [];
    if (isRead !== undefined) { where += ' AND is_read = ?'; params.push(isRead ? 1 : 0); }

    const offset = (page - 1) * limit;
    const total = db.prepare(`SELECT COUNT(*) as c FROM contact_messages WHERE ${where}`).get(...params).c;
    const messages = db.prepare(`
      SELECT * FROM contact_messages WHERE ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static findById(id) {
    return db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
  }

  static markAsRead(id) {
    return db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);
  }

  static delete(id) {
    return db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  }

  static getUnreadCount() {
    return db.prepare('SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0').get().c;
  }
}

module.exports = ContactModel;