import { nanoid } from 'nanoid';

import type { DB } from './client.js';
import { normalizeName } from '../utils/normalize.js';
import { toIso } from '../utils/dates.js';

const defaultSections = [
  {
    name: 'Indian Grocery',
    icon: '🌶️',
    color: '#f97316',
  },
  {
    name: 'Asian Grocery',
    icon: '🥢',
    color: '#06b6d4',
  },
];

export const bootstrapDefaults = (db: DB): void => {
  const activeCount = db
    .prepare('SELECT COUNT(*) as count FROM sections WHERE deleted_at IS NULL')
    .get() as { count: number };

  if (activeCount.count > 0) {
    return;
  }

  const now = toIso();
  const statement = db.prepare(
    `
      INSERT INTO sections(id, name, normalized_name, icon, color, created_at, updated_at, deleted_at)
      VALUES(@id, @name, @normalizedName, @icon, @color, @createdAt, @updatedAt, NULL)
    `,
  );

  const insertMany = db.transaction((sections: typeof defaultSections) => {
    for (const section of sections) {
      statement.run({
        id: nanoid(),
        name: section.name,
        normalizedName: normalizeName(section.name),
        icon: section.icon,
        color: section.color,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  insertMany(defaultSections);
};
