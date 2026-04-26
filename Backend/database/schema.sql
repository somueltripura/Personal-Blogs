-- ============================================================
-- Somuel's World — Database Schema
-- SQLite with WAL mode for production readiness
-- ============================================================

-- Users (admin accounts)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'admin',
  avatar        TEXT,
  bio           TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL UNIQUE,
  slug          TEXT    NOT NULL UNIQUE,
  description   TEXT,
  icon          TEXT,
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT    NOT NULL,
  slug             TEXT    NOT NULL UNIQUE,
  excerpt          TEXT,
  content          TEXT,
  cover_image      TEXT,
  category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status           TEXT    NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  meta_title       TEXT,
  meta_description TEXT,
  reading_time     INTEGER NOT NULL DEFAULT 1,
  views            INTEGER NOT NULL DEFAULT 0,
  featured         INTEGER NOT NULL DEFAULT 0,
  published_at     TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured, status);

-- Article Tags (many-to-many)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag         TEXT    NOT NULL,
  PRIMARY KEY (article_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  status        TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed')),
  subscribed_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_read ON contact_messages(is_read);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  tags        TEXT    DEFAULT '[]',
  live_url    TEXT,
  github_url  TEXT,
  status      TEXT    NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published')),
  featured    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Analytics (page views)
CREATE TABLE IF NOT EXISTS analytics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  visited_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_article ON analytics(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(visited_at);
CREATE INDEX IF NOT EXISTS idx_analytics_ip_article ON analytics(ip_address, article_id, visited_at);