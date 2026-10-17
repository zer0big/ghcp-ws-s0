import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories } from '../../db/schema';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('categories data-access helper', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all categories with id and name ordered alphabetically', async () => {
        await db.insert(categories).values([
            { name: 'Strategy', description: 's' },
            { name: 'Action', description: 'a' },
            { name: 'Puzzle', description: 'p' },
        ]);

        const all = await getAllCategories(db);

        expect(all).toEqual([
            { id: expect.any(Number), name: 'Action' },
            { id: expect.any(Number), name: 'Puzzle' },
            { id: expect.any(Number), name: 'Strategy' },
        ]);
    });
});
