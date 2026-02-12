import { Router } from 'express';
import { z } from 'zod';

import {
  createItem,
  deleteItem,
  getItemById,
  listItems,
  toggleItemChecked,
  toggleItemFavorite,
  toggleItemRunningLow,
  updateItem,
  type ItemFilters,
} from '../services/item-service.js';
import { asyncHandler } from '../utils/http.js';

const itemWriteSchema = z.object({
  sectionId: z.string().min(1, 'Section is required.'),
  name: z.string().trim().min(1, 'Item name is required.').max(120, 'Item name is too long.'),
  description: z.string().max(500).optional().default(''),
  priority: z.enum(['must', 'soon', 'optional']).default('soon'),
  remindEveryDays: z.coerce.number().int().min(0).max(365).default(0),
});

const itemQuerySchema = z.object({
  sectionId: z.string().optional(),
  search: z.string().optional(),
  checked: z.enum(['all', 'checked', 'unchecked']).optional().default('all'),
  priority: z.enum(['must', 'soon', 'optional']).optional(),
  sort: z.enum(['updated_desc', 'name_asc', 'priority', 'created_desc']).optional().default('name_asc'),
  favoritesOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  runningLowOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  view: z.enum(['myList', 'nextTrip', 'favorites', 'runningLow', 'reminders']).optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });
const checkToggleSchema = z.object({ checked: z.boolean().optional() });

export const itemRouter = Router();

itemRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = itemQuerySchema.parse(req.query);

    const filters: ItemFilters = {
      sectionId: query.sectionId,
      search: query.search,
      checked: query.checked,
      priority: query.priority,
      sort: query.sort,
      favoritesOnly: query.favoritesOnly,
      runningLowOnly: query.runningLowOnly,
      view: query.view,
    };

    if (query.view === 'favorites') {
      filters.favoritesOnly = true;
    }

    if (query.view === 'runningLow') {
      filters.runningLowOnly = true;
    }

    if (query.view === 'reminders') {
      filters.remindersOnly = true;
    }

    const items = listItems(filters);
    res.json({ data: items });
  }),
);

itemRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = itemWriteSchema.parse(req.body);
    const result = createItem(body);
    res.status(result.restored ? 200 : 201).json({ data: result.item, restored: result.restored });
  }),
);

itemRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ data: getItemById(id) });
  }),
);

itemRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = itemWriteSchema.parse(req.body);
    res.json({ data: updateItem(id, body) });
  }),
);

itemRouter.patch(
  '/:id/check',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = checkToggleSchema.parse(req.body || {});
    res.json({ data: toggleItemChecked(id, body.checked) });
  }),
);

itemRouter.patch(
  '/:id/favorite',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ data: toggleItemFavorite(id) });
  }),
);

itemRouter.patch(
  '/:id/running-low',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ data: toggleItemRunningLow(id) });
  }),
);

itemRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    deleteItem(id);
    res.status(204).send();
  }),
);
