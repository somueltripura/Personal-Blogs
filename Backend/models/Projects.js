const { db } = require('../config/database');
const slugify = require('slugify');

class ProjectModel {
  static create({ title, slug, description, coverImage, tags, liveUrl, githubUrl, status, featured }) {
    const projectSlug = slug || slugify(title, { lower: true, strict: true });
    const result = db.prepare(`
      INSERT INTO projects (title, slug, description, cover_image, tags, live_url, github_url, status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, projectSlug, description, coverImage,
      JSON.stringify(tags || []), liveUrl, githubUrl,
      status || 'published', featured ? 1 : 0
    );
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (project) {
      project.featured = Boolean(project.featured);
      try { project.tags = JSON.parse(project.tags); } catch { project.tags = []; }
    }
    return project;
  }

  static findAll({ status } = {}) {
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const projects = db.prepare(`
      SELECT * FROM projects WHERE ${where} ORDER BY created_at DESC
    `).all(...params);

    return projects.map(p => {
      p.featured = Boolean(p.featured);
      try { p.tags = JSON.parse(p.tags); } catch { p.tags = []; }
      return p;
    });
  }

  static update(id, data) {
    const allowed = ['title', 'slug', 'description', 'coverImage', 'tags', 'liveUrl', 'githubUrl', 'status', 'featured'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && value !== undefined) {
        const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (key === 'slug') {
          fields.push('slug = ?');
          values.push(slugify(value, { lower: true, strict: true }));
        } else if (key === 'tags') {
          fields.push('tags = ?');
          values.push(JSON.stringify(value));
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

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  static delete(id) {
    return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}

module.exports = ProjectModel;