const express = require('express');
const router = express.Router();
const Joi = require('joi');
const CategoryModel = require('../models/Category');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().max(100),
  description: Joi.string().max(300).allow(''),
  icon: Joi.string().max(50).allow(''),
});

// GET /api/categories — public
router.get('/', (req, res) => {
  res.json(CategoryModel.findAll());
});

// GET /api/categories/:slug — public
router.get('/:slug', (req, res) => {
  const cat = CategoryModel.findBySlug(req.params.slug);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  res.json(cat);
});

// POST /api/categories — admin
router.post('/', requireAuth, requireAdmin, (req, res, next) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const category = CategoryModel.create(value);
    res.status(201).json({ category, message: 'Category created.' });
  } catch (err) { next(err); }
});

// PUT /api/categories/:id — admin
router.put('/:id', requireAuth, requireAdmin, (req, res, next) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const category = CategoryModel.update(parseInt(req.params.id), value);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json({ category, message: 'Category updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/categories/:id — admin
router.delete('/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    CategoryModel.delete(parseInt(req.params.id));
    res.json({ message: 'Category deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;