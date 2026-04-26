const express = require('express');
const router = express.Router();
const Joi = require('joi');
const ContactModel = require('../models/Contact');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const contactSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  message: Joi.string().min(10).max(5000).required(),
});

// POST /api/contact — public
router.post('/', (req, res, next) => {
  const { error, value } = contactSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = ContactModel.create(value);
    res.status(201).json({ message: 'Message sent successfully. I\'ll get back to you soon.', ...result });
  } catch (err) { next(err); }
});

// GET /api/contact/messages — admin
router.get('/messages', requireAuth, requireAdmin, (req, res) => {
  const { page, limit, isRead } = req.query;
  const result = ContactModel.findAll({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
  });
  res.json(result);
});

// GET /api/contact/messages/unread-count — admin
router.get('/messages/unread-count', requireAuth, requireAdmin, (req, res) => {
  res.json({ count: ContactModel.getUnreadCount() });
});

// GET /api/contact/messages/:id — admin
router.get('/messages/:id', requireAuth, requireAdmin, (req, res) => {
  const message = ContactModel.findById(parseInt(req.params.id));
  if (!message) return res.status(404).json({ error: 'Message not found.' });
  res.json(message);
});

// PATCH /api/contact/messages/:id/read — admin
router.patch('/messages/:id/read', requireAuth, requireAdmin, (req, res) => {
  ContactModel.markAsRead(parseInt(req.params.id));
  res.json({ message: 'Marked as read.' });
});

// DELETE /api/contact/messages/:id — admin
router.delete('/messages/:id', requireAuth, requireAdmin, (req, res) => {
  ContactModel.delete(parseInt(req.params.id));
  res.json({ message: 'Message deleted.' });
});

module.exports = router;