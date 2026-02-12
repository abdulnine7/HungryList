import { Router } from 'express';
import { z } from 'zod';

import { createBackup, deleteBackup, listBackups, restoreBackup } from '../services/backup-service.js';
import { asyncHandler } from '../utils/http.js';

const restoreBodySchema = z.object({
  createCurrentBackup: z.boolean().optional().default(false),
});

export const backupRouter = Router();

backupRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: listBackups() });
  }),
);

backupRouter.post(
  '/',
  asyncHandler(async (_req, res) => {
    const backup = createBackup('manual');
    res.status(201).json({ data: backup });
  }),
);

backupRouter.post(
  '/:id/restore',
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = restoreBodySchema.parse(req.body || {});
    const result = restoreBackup(id, { createCurrentBackup: body.createCurrentBackup });
    res.json({ data: result });
  }),
);

backupRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    deleteBackup(id);
    res.status(204).send();
  }),
);
