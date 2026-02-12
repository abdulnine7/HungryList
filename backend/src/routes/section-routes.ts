import { Router } from 'express';
import { z } from 'zod';

import { createSection, deleteSection, listSections, updateSection } from '../services/section-service.js';
import { asyncHandler } from '../utils/http.js';

const sectionSchema = z.object({
  name: z.string().trim().min(1, 'Section name is required.').max(64, 'Section name is too long.'),
  icon: z.string().trim().min(1, 'Section icon is required.').max(10),
  color: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/, 'Color must be a valid hex color.'),
});

const includeDeletedSchema = z
  .object({
    includeDeleted: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  })
  .default({});

export const sectionRouter = Router();

sectionRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = includeDeletedSchema.parse(req.query);
    res.json({ data: listSections(query.includeDeleted) });
  }),
);

sectionRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = sectionSchema.parse(req.body);
    const section = createSection(body);
    res.status(201).json({ data: section });
  }),
);

sectionRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = sectionSchema.parse(req.body);
    const section = updateSection(params.id, body);
    res.json({ data: section });
  }),
);

sectionRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    deleteSection(params.id);
    res.status(204).send();
  }),
);
