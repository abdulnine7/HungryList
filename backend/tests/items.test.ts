import { beforeEach, describe, expect, it } from 'vitest';

import { app, login, resetDatabase } from './test-utils.js';

describe('item duplicate and restore behavior', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('returns duplicate error and restores soft-deleted item on re-add', async () => {
    const agent = await login();

    const sectionResponse = await agent.get('/api/sections');
    expect(sectionResponse.status).toBe(200);

    const sectionId = sectionResponse.body.data[0].id;

    const created = await agent.post('/api/items').send({
      sectionId,
      name: 'Milk',
      description: '2%',
      priority: 'must',
      remindEveryDays: 7,
    });

    expect(created.status).toBe(201);
    const itemId = created.body.data.id;

    const duplicate = await agent.post('/api/items').send({
      sectionId,
      name: '  mIlK  ',
      description: 'whole',
      priority: 'soon',
      remindEveryDays: 0,
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('DUPLICATE_ITEM');

    const deleted = await agent.delete(`/api/items/${itemId}`);
    expect(deleted.status).toBe(204);

    const restored = await agent.post('/api/items').send({
      sectionId,
      name: 'milk',
      description: 'skim',
      priority: 'optional',
      remindEveryDays: 3,
    });

    expect(restored.status).toBe(200);
    expect(restored.body.restored).toBe(true);
    expect(restored.body.data.id).toBe(itemId);
  });
});
