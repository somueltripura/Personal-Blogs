const { db } = require('../config/database');
const slugify = require('slugify');

class CategoryModel {
  static create({ name, slug, description, icon }) {
    const catSlug = slug || slugify(name, { lower: true, strict: true });
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, icon)
      VALUES (?, ?, ?, ?)
    `).run(name, catSlug, description, icon);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  static findBySlug(slug) {
    return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  }

  static findAll() {
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  }

  static update(id, data) {
    const allowed = ['name', 'slug', 'description', 'icon'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (key === 'slug') {
          fields.push('slug = ?');
          values.push(slugify(value, { lower: true, strict: true }));
        } else {
          fields.push(`${column} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  static delete(id) {
    // Check if category has articles
    const count = db.prepare('SELECT COUNT(*) as c FROM articles WHERE category_id = ?').get(id).c;
    if (count > 0) {
      throw new Error(`Cannot delete category: it has ${count} article(s). Reassign them first.`);
    }
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
}

module.exports = CategoryModel;