const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UserModel = require('../models/User');
const { generateToken } = require('../config/auth');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { uploadSingle } = require('../middleware/upload');

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// POST /api/auth/login
router.post('/login', authLimiter, (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = UserModel.findByEmail(value.email);
  if (!user || !UserModel.verifyPassword(value.password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  res.json({
    token,
    user: safeUser,
    message: 'Logged in successfully.',
  });
});

// GET /api/auth/me — get current user
router.get('/me', requireAuth, (req, res) => {
  const user = UserModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

// PUT /api/auth/profile — update profile
router.put('/profile', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const user = UserModel.update(req.user.id, req.body);
    res.json({ user, message: 'Profile updated.' });
  } catch (err) { next(err); }
});

// POST /api/auth/avatar — upload avatar
router.post('/avatar', requireAuth, requireAdmin, uploadSingle('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload an image.' });

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  UserModel.update(req.user.id, { avatar: avatarUrl });
  res.json({ avatar: avatarUrl, message: 'Avatar updated.' });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, requireAdmin, (req, res, next) => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    UserModel.changePassword(req.user.id, value.currentPassword, value.newPassword);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;