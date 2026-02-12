import { nanoid } from 'nanoid';

import { db } from '../db/client.js';
import { toIso } from '../utils/dates.js';
import { AppError } from '../utils/errors.js';
import { normalizeName } from '../utils/normalize.js';
import { recordHistory } from './history-service.js';

export type ItemPriority = 'must' | 'soon' | 'optional';
export type CheckedFilter = 'all' | 'checked' | 'unchecked';
export type ItemSort = 'updated_desc' | 'name_asc' | 'priority' | 'created_desc';

export type Item = {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  priority: ItemPriority;
  remindEveryDays: number;
  checked: boolean;
  favorite: boolean;
  runningLow: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  reminderDue: boolean;
};

export type ItemFilters = {
  sectionId?: string;
  search?: string;
  checked?: CheckedFilter;
  priority?: ItemPriority;
  sort?: ItemSort;
  favoritesOnly?: boolean;
  runningLowOnly?: boolean;
  remindersOnly?: boolean;
};

type ItemRow = {
  id: string;
  section_id: string;
  name: string;
  description: string;
  priority: ItemPriority;
  remind_every_days: number;
  checked: number;
  favorite: number;
  running_low: number;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  reminder_due: number;
};

const mapItem = (row: ItemRow): Item => ({
  id: row.id,
  sectionId: row.section_id,
  name: row.name,
  description: row.description,
  priority: row.priority,
  remindEveryDays: row.remind_every_days,
  checked: Boolean(row.checked),
  favorite: Boolean(row.favorite),
  runningLow: Boolean(row.running_low),
  lastCheckedAt: row.last_checked_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  reminderDue: Boolean(row.reminder_due),
});

const ensureActiveSection = (sectionId: string): void => {
  const section = db
    .prepare('SELECT id FROM sections WHERE id = ? AND deleted_at IS NULL')
    .get(sectionId) as { id: string } | undefined;

  if (!section) {
    throw new AppError(400, 'INVALID_SECTION', 'Please select a valid active section.');
  }
};

const ensureItemById = (id: string): ItemRow => {
  const row = db
    .prepare(
      `
      SELECT
        i.*,
        CASE
          WHEN i.remind_every_days > 0 AND
               JULIANDAY('now') - JULIANDAY(COALESCE(i.last_checked_at, i.created_at)) >= i.remind_every_days
          THEN 1 ELSE 0
        END AS reminder_due
      FROM items i
      WHERE i.id = @id
        AND i.deleted_at IS NULL
      LIMIT 1
    `,
    )
    .get({ id }) as ItemRow | undefined;

  if (!row) {
    throw new AppError(404, 'ITEM_NOT_FOUND', 'Item not found.');
  }

  return row;
};

export const listItems = (filters: ItemFilters): Item[] => {
  const where: string[] = ['i.deleted_at IS NULL'];
  const params: Record<string, unknown> = {};

  if (filters.sectionId) {
    where.push('i.section_id = @sectionId');
    params.sectionId = filters.sectionId;
  }

  if (filters.search) {
    where.push('(LOWER(i.name) LIKE @search OR LOWER(i.description) LIKE @search)');
    params.search = `%${filters.search.toLowerCase()}%`;
  }

  if (filters.checked === 'checked') {
    where.push('i.checked = 1');
  }

  if (filters.checked === 'unchecked') {
    where.push('i.checked = 0');
  }

  if (filters.priority) {
    where.push('i.priority = @priority');
    params.priority = filters.priority;
  }

  if (filters.favoritesOnly) {
    where.push('i.favorite = 1');
  }

  if (filters.runningLowOnly) {
    where.push('i.running_low = 1');
  }

  if (filters.remindersOnly) {
    where.push(
      "i.remind_every_days > 0 AND JULIANDAY('now') - JULIANDAY(COALESCE(i.last_checked_at, i.created_at)) >= i.remind_every_days",
    );
  }

  const orderBy =
    filters.sort === 'name_asc'
      ? 'i.name COLLATE NOCASE ASC'
      : filters.sort === 'priority'
        ? "CASE i.priority WHEN 'must' THEN 1 WHEN 'soon' THEN 2 ELSE 3 END ASC, i.updated_at DESC"
        : filters.sort === 'created_desc'
          ? 'i.created_at DESC'
          : 'i.updated_at DESC';

  const rows = db
    .prepare(
      `
      SELECT
        i.*,
        CASE
          WHEN i.remind_every_days > 0 AND
               JULIANDAY('now') - JULIANDAY(COALESCE(i.last_checked_at, i.created_at)) >= i.remind_every_days
          THEN 1 ELSE 0
        END AS reminder_due
      FROM items i
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
    `,
    )
    .all(params) as ItemRow[];

  return rows.map(mapItem);
};

export const createItem = (payload: {
  sectionId: string;
  name: string;
  description?: string;
  priority: ItemPriority;
  remindEveryDays: number;
}): { item: Item; restored: boolean } => {
  ensureActiveSection(payload.sectionId);

  const normalizedName = normalizeName(payload.name);

  const existing = db
    .prepare(
      `
      SELECT
        id,
        deleted_at,
        checked,
        favorite,
        running_low,
        last_checked_at,
        created_at,
        updated_at
      FROM items
      WHERE section_id = @sectionId
        AND normalized_name = @normalizedName
      LIMIT 1
    `,
    )
    .get({
      sectionId: payload.sectionId,
      normalizedName,
    }) as
    | {
        id: string;
        deleted_at: string | null;
        checked: number;
        favorite: number;
        running_low: number;
        last_checked_at: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  const now = toIso();

  if (existing && !existing.deleted_at) {
    throw new AppError(
      409,
      'DUPLICATE_ITEM',
      'This item already exists in the selected section.',
      'Choose a different name or edit the existing item.',
    );
  }

  if (existing && existing.deleted_at) {
    db.prepare(
      `
      UPDATE items
      SET name = @name,
          normalized_name = @normalizedName,
          description = @description,
          priority = @priority,
          remind_every_days = @remindEveryDays,
          deleted_at = NULL,
          updated_at = @updatedAt
      WHERE id = @id
    `,
    ).run({
      id: existing.id,
      name: payload.name,
      normalizedName,
      description: payload.description ?? '',
      priority: payload.priority,
      remindEveryDays: payload.remindEveryDays,
      updatedAt: now,
    });

    recordHistory('item', existing.id, 'restored', payload);
    return { item: getItemById(existing.id), restored: true };
  }

  const id = nanoid();

  db.prepare(
    `
    INSERT INTO items(
      id,
      section_id,
      name,
      normalized_name,
      description,
      priority,
      remind_every_days,
      checked,
      favorite,
      running_low,
      last_checked_at,
      created_at,
      updated_at,
      deleted_at
    )
    VALUES(
      @id,
      @sectionId,
      @name,
      @normalizedName,
      @description,
      @priority,
      @remindEveryDays,
      0,
      0,
      0,
      NULL,
      @createdAt,
      @updatedAt,
      NULL
    )
  `,
  ).run({
    id,
    sectionId: payload.sectionId,
    name: payload.name,
    normalizedName,
    description: payload.description ?? '',
    priority: payload.priority,
    remindEveryDays: payload.remindEveryDays,
    createdAt: now,
    updatedAt: now,
  });

  recordHistory('item', id, 'created', payload);
  return { item: getItemById(id), restored: false };
};

export const updateItem = (
  id: string,
  payload: {
    sectionId: string;
    name: string;
    description?: string;
    priority: ItemPriority;
    remindEveryDays: number;
  },
): Item => {
  ensureItemById(id);
  ensureActiveSection(payload.sectionId);

  const normalizedName = normalizeName(payload.name);

  const duplicate = db
    .prepare(
      `
      SELECT id
      FROM items
      WHERE section_id = @sectionId
        AND normalized_name = @normalizedName
        AND deleted_at IS NULL
        AND id != @id
      LIMIT 1
    `,
    )
    .get({
      id,
      sectionId: payload.sectionId,
      normalizedName,
    }) as { id: string } | undefined;

  if (duplicate) {
    throw new AppError(
      409,
      'DUPLICATE_ITEM',
      'This item already exists in the selected section.',
      'Choose a different name or edit the existing item.',
    );
  }

  db.prepare(
    `
    UPDATE items
    SET section_id = @sectionId,
        name = @name,
        normalized_name = @normalizedName,
        description = @description,
        priority = @priority,
        remind_every_days = @remindEveryDays,
        updated_at = @updatedAt
    WHERE id = @id
      AND deleted_at IS NULL
  `,
  ).run({
    id,
    sectionId: payload.sectionId,
    name: payload.name,
    normalizedName,
    description: payload.description ?? '',
    priority: payload.priority,
    remindEveryDays: payload.remindEveryDays,
    updatedAt: toIso(),
  });

  recordHistory('item', id, 'updated', payload);
  return getItemById(id);
};

export const deleteItem = (id: string): void => {
  ensureItemById(id);
  const now = toIso();

  db.prepare('UPDATE items SET deleted_at = @now, updated_at = @now WHERE id = @id').run({ id, now });

  recordHistory('item', id, 'deleted');
};

export const toggleItemChecked = (id: string, checked?: boolean): Item => {
  const item = ensureItemById(id);
  const nextChecked = checked ?? !Boolean(item.checked);
  const now = toIso();

  db.prepare(
    `
    UPDATE items
    SET checked = @checked,
        last_checked_at = CASE WHEN @checked = 1 THEN @now ELSE last_checked_at END,
        updated_at = @now
    WHERE id = @id
  `,
  ).run({
    id,
    checked: nextChecked ? 1 : 0,
    now,
  });

  recordHistory('item', id, nextChecked ? 'checked' : 'unchecked');

  return getItemById(id);
};

export const toggleItemFavorite = (id: string): Item => {
  const item = ensureItemById(id);
  const nextFavorite = !Boolean(item.favorite);

  db.prepare('UPDATE items SET favorite = @favorite, updated_at = @now WHERE id = @id').run({
    id,
    favorite: nextFavorite ? 1 : 0,
    now: toIso(),
  });

  recordHistory('item', id, nextFavorite ? 'favorited' : 'unfavorited');

  return getItemById(id);
};

export const toggleItemRunningLow = (id: string): Item => {
  const item = ensureItemById(id);
  const nextRunningLow = !Boolean(item.running_low);

  db.prepare('UPDATE items SET running_low = @runningLow, updated_at = @now WHERE id = @id').run({
    id,
    runningLow: nextRunningLow ? 1 : 0,
    now: toIso(),
  });

  recordHistory('item', id, nextRunningLow ? 'running_low_on' : 'running_low_off');

  return getItemById(id);
};

export const getItemById = (id: string): Item => {
  const row = ensureItemById(id);
  return mapItem(row);
};
