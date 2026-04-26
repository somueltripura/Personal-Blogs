const express = require('express');
const router = express.Router();
const Joi = require('joi');
const ArticleModel = require('../models/Article');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadSingle, uploadNone } = require('../middleware/upload');

const articleSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  slug: Joi.string().max(200),
  excerpt: Joi.string().max(500).allow(''),
  content: Joi.string().allow(''),
  categoryId: Joi.number().integer().positive(),
  status: Joi.string().valid('draft', 'published'),
  metaTitle: Joi.string().max(200).allow(''),
  metaDescription: Joi.string().max(500).allow(''),
  featured: Joi.boolean(),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
});

// ============================================================
// PUBLIC ROUTES
// ============================================================

// GET /api/articles — published articles (paginated)
router.get('/', (req, res) => {
  const { page, limit, categoryId, search } = req.query;
  const result = ArticleModel.findPublished({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 12,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    search,
  });
  res.json(result);
});

// GET /api/articles/featured
router.get('/featured', (req, res) => {
  res.json(ArticleModel.findFeatured());
});

// GET /api/articles/tags
router.get('/tags', (req, res) => {
  res.json(ArticleModel.getAllTags());
});

// GET /api/articles/:slug — single article by slug
router.get('/:slug', (req, res) => {
  const article = ArticleModel.findBySlug(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Article not found.' });

  // Track view
  const ip = req.ip || req.connection.remoteAddress;
  ArticleModel.incrementViews(article.id);

  res.json(article);
});

// ============================================================
// ADMIN ROUTES (protected)
// ============================================================

// GET /api/articles/admin/all — all articles including drafts
router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
  const { page, limit, status, categoryId, search, featured } = req.query;
  const result = ArticleModel.findAll({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    search,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  });
  res.json(result);
});

// GET /api/articles/admin/:id — single article by ID (admin)
router.get('/admin/:id', requireAuth, requireAdmin, (req, res) => {
  const article = ArticleModel.findById(parseInt(req.params.id));
  if (!article) return res.status(404).json({ error: 'Article not found.' });
  res.json(article);
});

// POST /api/articles — create article
router.post('/', requireAuth, requireAdmin, uploadSingle('coverImage'), (req, res, next) => {
  const { error, value } = articleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const coverImage = req.file ? `/uploads/articles/${req.file.filename}` : null;
    const article = ArticleModel.create({
      ...value,
      coverImage,
    });

    // Set tags if provided
    if (value.tags) ArticleModel.setTags(article.id, value.tags);

    res.status(201).json({ article, message: 'Article created.' });
  } catch (err) { next(err); }
});

// PUT /api/articles/:id — update article
router.put('/:id', requireAuth, requireAdmin, uploadSingle('coverImage'), (req, res, next) => {
  const { error, value } = articleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const updateData = { ...value };
    if (req.file) updateData.coverImage = `/uploads/articles/${req.file.filename}`;

    const article = ArticleModel.update(parseInt(req.params.id), updateData);

    if (value.tags) ArticleModel.setTags(article.id, value.tags);

    res.json({ article, message: 'Article updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/articles/:id
router.delete('/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    ArticleModel.delete(parseInt(req.params.id));
    res.json({ message: 'Article deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;