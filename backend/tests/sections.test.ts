import { beforeEach, describe, expect, it } from 'vitest';

import { login, resetDatabase } from './test-utils.js';

describe('sections constraints', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('prevents deleting the last active section', async () => {
    const agent = await login();

    const sectionsResponse = await agent.get('/api/sections');
    const sections = sectionsResponse.body.data as Array<{ id: string; name: string }>;

    expect(sections.length).toBe(2);

    const duplicate = await agent.post('/api/sections').send({
      name: ' indian   grocery ',
      icon: '🛒',
      color: '#10b981',
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('DUPLICATE_SECTION');

    const firstDelete = await agent.delete(`/api/sections/${sections[0].id}`);
    expect(firstDelete.status).toBe(204);

    const secondDelete = await agent.delete(`/api/sections/${sections[1].id}`);
    expect(secondDelete.status).toBe(400);
    expect(secondDelete.body.code).toBe('LAST_SECTION_PROTECTED');
  });
});
