import { nanoid } from 'nanoid';

import { db } from '../db/client.js';
import { toIso } from '../utils/dates.js';
import { AppError } from '../utils/errors.js';
import { normalizeName } from '../utils/normalize.js';
import { recordHistory } from './history-service.js';

export type Section = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

const mapSection = (
  row: {
    id: string;
    name: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  },
): Section => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
});

export const listSections = (includeDeleted = false): Section[] => {
  const rows = db
    .prepare(
      `
      SELECT id, name, icon, color, created_at, updated_at, deleted_at
      FROM sections
      ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'}
      ORDER BY created_at ASC
    `,
    )
    .all() as Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;

  return rows.map(mapSection);
};

export const createSection = (payload: { name: string; icon: string; color: string }): Section => {
  const normalizedName = normalizeName(payload.name);

  const duplicate = db
    .prepare(
      'SELECT id FROM sections WHERE normalized_name = ? AND deleted_at IS NULL LIMIT 1',
    )
    .get(normalizedName) as { id: string } | undefined;

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_SECTION', 'A section with this name already exists.');
  }

  const now = toIso();
  const id = nanoid();

  db.prepare(
    `
    INSERT INTO sections(id, name, normalized_name, icon, color, created_at, updated_at, deleted_at)
    VALUES(@id, @name, @normalizedName, @icon, @color, @createdAt, @updatedAt, NULL)
  `,
  ).run({
    id,
    name: payload.name,
    normalizedName,
    icon: payload.icon,
    color: payload.color,
    createdAt: now,
    updatedAt: now,
  });

  recordHistory('section', id, 'created', payload);

  return getSectionById(id);
};

export const updateSection = (
  id: string,
  payload: { name: string; icon: string; color: string },
): Section => {
  const normalizedName = normalizeName(payload.name);
  const existing = db
    .prepare('SELECT id FROM sections WHERE id = ? AND deleted_at IS NULL')
    .get(id) as { id: string } | undefined;

  if (!existing) {
    throw new AppError(404, 'SECTION_NOT_FOUND', 'Section not found.');
  }

  const duplicate = db
    .prepare(
      `
      SELECT id
      FROM sections
      WHERE normalized_name = @normalizedName
        AND deleted_at IS NULL
        AND id != @id
      LIMIT 1
    `,
    )
    .get({ normalizedName, id }) as { id: string } | undefined;

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_SECTION', 'A section with this name already exists.');
  }

  db.prepare(
    `
    UPDATE sections
    SET name = @name,
        normalized_name = @normalizedName,
        icon = @icon,
        color = @color,
        updated_at = @updatedAt
    WHERE id = @id
  `,
  ).run({
    id,
    name: payload.name,
    normalizedName,
    icon: payload.icon,
    color: payload.color,
    updatedAt: toIso(),
  });

  recordHistory('section', id, 'updated', payload);

  return getSectionById(id);
};

export const deleteSection = (id: string): void => {
  const section = db
    .prepare('SELECT id FROM sections WHERE id = ? AND deleted_at IS NULL')
    .get(id) as { id: string } | undefined;

  if (!section) {
    throw new AppError(404, 'SECTION_NOT_FOUND', 'Section not found.');
  }

  const activeCount = db
    .prepare('SELECT COUNT(*) as count FROM sections WHERE deleted_at IS NULL AND id != ?')
    .get(id) as { count: number };

  if (activeCount.count === 0) {
    throw new AppError(
      400,
      'LAST_SECTION_PROTECTED',
      'At least one active section is required. Create another section before deleting this one.',
    );
  }

  const now = toIso();
  const transaction = db.transaction(() => {
    db.prepare('UPDATE sections SET deleted_at = @now, updated_at = @now WHERE id = @id').run({ id, now });
    db.prepare('UPDATE items SET deleted_at = @now, updated_at = @now WHERE section_id = @id AND deleted_at IS NULL').run({
      id,
      now,
    });
  });

  transaction();
  recordHistory('section', id, 'deleted');
};

export const getSectionById = (id: string): Section => {
  const row = db
    .prepare(
      `
      SELECT id, name, icon, color, created_at, updated_at, deleted_at
      FROM sections
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(id) as
    | {
        id: string;
        name: string;
        icon: string;
        color: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }
    | undefined;

  if (!row) {
    throw new AppError(404, 'SECTION_NOT_FOUND', 'Section not found.');
  }

  return mapSection(row);
};
