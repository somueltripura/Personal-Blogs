const express = require('express');
const router = express.Router();
const AnalyticsModel = require('../models/Analytics');
const ArticleModel = require('../models/Article');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/analytics/overview — dashboard stats
router.get('/overview', requireAuth, requireAdmin, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const articleStats = ArticleModel.getStats();
  const recentViews = AnalyticsModel.getTotalViews(days);
  const topArticles = AnalyticsModel.getTopArticles(5, days);
  const dailyViews = AnalyticsModel.getDailyViews(days);

  res.json({
    articles: articleStats,
    recentViews,
    topArticles,
    dailyViews,
    period: `${days} days`,
  });
});

// GET /api/analytics/articles/:id — per-article stats
router.get('/articles/:id', requireAuth, requireAdmin, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = AnalyticsModel.getArticleStats(parseInt(req.params.id), days);
  res.json({ articleId: req.params.id, stats, period: `${days} days` });
});

// POST /api/analytics/track — track a view (public, but rate-limited via article route)
router.post('/track', (req, res) => {
  const { articleId } = req.body;
  if (!articleId) return res.status(400).json({ error: 'articleId is required.' });

  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const tracked = AnalyticsModel.track({ articleId, ip, userAgent });

  res.json({ tracked });
});

module.exports = router;