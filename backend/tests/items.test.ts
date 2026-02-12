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

describe('item ordering behavior', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('defaults to alphabetical order and pushes checked items to the bottom', async () => {
    const agent = await login();
    const sectionResponse = await agent.get('/api/sections');
    const sectionId = sectionResponse.body.data[0].id as string;

    const banana = await agent.post('/api/items').send({
      sectionId,
      name: 'Banana',
      description: '',
      priority: 'soon',
      remindEveryDays: 0,
    });
    expect(banana.status).toBe(201);

    const apple = await agent.post('/api/items').send({
      sectionId,
      name: 'Apple',
      description: '',
      priority: 'soon',
      remindEveryDays: 0,
    });
    expect(apple.status).toBe(201);

    const carrot = await agent.post('/api/items').send({
      sectionId,
      name: 'Carrot',
      description: '',
      priority: 'soon',
      remindEveryDays: 0,
    });
    expect(carrot.status).toBe(201);

    const initialList = await agent.get(`/api/items?sectionId=${sectionId}`);
    expect(initialList.status).toBe(200);
    expect(initialList.body.data.map((item: { name: string }) => item.name)).toEqual(['Apple', 'Banana', 'Carrot']);

    const checkApple = await agent.patch(`/api/items/${apple.body.data.id}/check`).send({});
    expect(checkApple.status).toBe(200);

    const reorderedList = await agent.get(`/api/items?sectionId=${sectionId}`);
    expect(reorderedList.status).toBe(200);
    expect(reorderedList.body.data.map((item: { name: string }) => item.name)).toEqual(['Banana', 'Carrot', 'Apple']);
  });
});
