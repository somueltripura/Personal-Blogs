const express = require('express');
const router = express.Router();
const Joi = require('joi');
const NewsletterModel = require('../models/Newsletter');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const subscribeSchema = Joi.object({
  email: Joi.string().email().required(),
});

// POST /api/newsletter/subscribe — public
router.post('/subscribe', (req, res, next) => {
  const { error, value } = subscribeSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = NewsletterModel.subscribe(value.email);
    res.json({ message: result.status === 'reactivated' ? 'Welcome back! Your subscription is reactivated.' : 'Successfully subscribed!', ...result });
  } catch (err) { next(err); }
});

// POST /api/newsletter/unsubscribe — public
router.post('/unsubscribe', (req, res) => {
  const { error, value } = subscribeSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const success = NewsletterModel.unsubscribe(value.email);
  if (!success) return res.status(404).json({ error: 'Email not found or already unsubscribed.' });
  res.json({ message: 'You have been unsubscribed.' });
});

// GET /api/newsletter/subscribers — admin
router.get('/subscribers', requireAuth, requireAdmin, (req, res) => {
  const { page, limit, status } = req.query;
  const result = NewsletterModel.findAll({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
    status,
  });
  res.json(result);
});

// GET /api/newsletter/count — admin
router.get('/count', requireAuth, requireAdmin, (req, res) => {
  res.json({ count: NewsletterModel.getActiveCount() });
});

// DELETE /api/newsletter/subscribers/:id — admin
router.delete('/subscribers/:id', requireAuth, requireAdmin, (req, res) => {
  NewsletterModel.delete(parseInt(req.params.id));
  res.json({ message: 'Subscriber removed.' });
});

module.exports = router;