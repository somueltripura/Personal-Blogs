const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  /**
   * Create a new user
   */
  static create({ username, email, password }) {
    const passwordHash = bcrypt.hashSync(password, 12);
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, 'admin')
    `).run(username, email, passwordHash);

    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find user by ID (excludes password)
   */
  static findById(id) {
    return db.prepare(`
      SELECT id, username, email, role, avatar, bio, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id);
  }

  /**
   * Find user by email (includes password hash for auth)
   */
  static findByEmail(email) {
    return db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email);
  }

  /**
   * Find user by username
   */
  static findByUsername(username) {
    return db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username);
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Update user profile
   */
  static update(id, data) {
    const allowed = ['username', 'email', 'avatar', 'bio'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  /**
   * Change password
   */
  static changePassword(id, currentPassword, newPassword) {
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      throw new Error('Current password is incorrect.');
    }
    const hash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(hash, new Date().toISOString(), id);
    return true;
  }
}

module.exports = UserModel;