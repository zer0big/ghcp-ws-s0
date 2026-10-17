import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { publishers } from '../../db/schema';
import type { Database } from './db';
import { getAllPublishers } from './publishers';

describe('publishers data-access helper', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all publishers with id and name ordered alphabetically', async () => {
        await db.insert(publishers).values([
            { name: 'Zeta Games', description: 'z' },
            { name: 'Alpha Forge', description: 'a' },
        ]);

        const all = await getAllPublishers(db);

        expect(all).toEqual([
            { id: expect.any(Number), name: 'Alpha Forge' },
            { id: expect.any(Number), name: 'Zeta Games' },
        ]);
    });
});
