const express = require('express');
const router = express.Router();
const Joi = require('joi');
const ProjectModel = require('../models/Projects');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const projectSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  slug: Joi.string().max(200),
  description: Joi.string().max(2000).allow(''),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  liveUrl: Joi.string().uri().allow(''),
  githubUrl: Joi.string().uri().allow(''),
  status: Joi.string().valid('draft', 'published'),
  featured: Joi.boolean(),
});

// GET /api/projects — public
router.get('/', (req, res) => {
  const { status } = req.query;
  res.json(ProjectModel.findAll({ status: status || 'published' }));
});

// GET /api/projects/:slug — public
router.get('/:slug', (req, res) => {
  const projects = ProjectModel.findAll({ status: 'published' });
  const project = projects.find(p => p.slug === req.params.slug);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project);
});

// POST /api/projects — admin
router.post('/', requireAuth, requireAdmin, uploadSingle('coverImage'), (req, res, next) => {
  const { error, value } = projectSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const coverImage = req.file ? `/uploads/projects/${req.file.filename}` : null;
    const project = ProjectModel.create({ ...value, coverImage });
    res.status(201).json({ project, message: 'Project created.' });
  } catch (err) { next(err); }
});

// PUT /api/projects/:id — admin
router.put('/:id', requireAuth, requireAdmin, uploadSingle('coverImage'), (req, res, next) => {
  const { error, value } = projectSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const updateData = { ...value };
    if (req.file) updateData.coverImage = `/uploads/projects/${req.file.filename}`;
    const project = ProjectModel.update(parseInt(req.params.id), updateData);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project, message: 'Project updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id — admin
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const result = ProjectModel.delete(parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found.' });
  res.json({ message: 'Project deleted.' });
});

module.exports = router;