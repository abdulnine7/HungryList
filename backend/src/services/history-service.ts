import { nanoid } from 'nanoid';

import { db } from '../db/client.js';
import { toIso } from '../utils/dates.js';

export type HistoryEntity = 'section' | 'item' | 'backup' | 'system';

export const recordHistory = (
  entityType: HistoryEntity,
  entityId: string,
  action: string,
  payload?: Record<string, unknown>,
): void => {
  db.prepare(
    `
    INSERT INTO history_events(id, entity_type, entity_id, action, payload_json, created_at)
    VALUES(@id, @entityType, @entityId, @action, @payloadJson, @createdAt)
  `,
  ).run({
    id: nanoid(),
    entityType,
    entityId,
    action,
    payloadJson: payload ? JSON.stringify(payload) : null,
    createdAt: toIso(),
  });
};
