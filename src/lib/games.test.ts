import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    describe('getFilteredGames', () => {
        it('returns all games when no filters are provided', async () => {
            await seedGames(db, 3);
            const filtered = await getFilteredGames(db);
            expect(filtered.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        });

        it('filters games by category', async () => {
            const [strategy] = await db
                .insert(categories)
                .values({ name: 'Strategy', description: 's' })
                .returning({ id: categories.id });
            const [action] = await db
                .insert(categories)
                .values({ name: 'Action', description: 'a' })
                .returning({ id: categories.id });
            const [publisher] = await db
                .insert(publishers)
                .values({ name: 'Pub One', description: 'p' })
                .returning({ id: publishers.id });

            await db.insert(games).values([
                {
                    title: 'Strategy Game',
                    description: 'desc',
                    categoryId: strategy.id,
                    publisherId: publisher.id,
                },
                {
                    title: 'Action Game',
                    description: 'desc',
                    categoryId: action.id,
                    publisherId: publisher.id,
                },
            ]);

            const filtered = await getFilteredGames(db, { categoryIds: [strategy.id] });
            expect(filtered.map((g) => g.title)).toEqual(['Strategy Game']);
        });

        it('filters games by publisher', async () => {
            const [category] = await db
                .insert(categories)
                .values({ name: 'Strategy', description: 'cat' })
                .returning({ id: categories.id });
            const [pubA] = await db
                .insert(publishers)
                .values({ name: 'Publisher A', description: 'a' })
                .returning({ id: publishers.id });
            const [pubB] = await db
                .insert(publishers)
                .values({ name: 'Publisher B', description: 'b' })
                .returning({ id: publishers.id });

            await db.insert(games).values([
                {
                    title: 'Game A',
                    description: 'desc',
                    categoryId: category.id,
                    publisherId: pubA.id,
                },
                {
                    title: 'Game B',
                    description: 'desc',
                    categoryId: category.id,
                    publisherId: pubB.id,
                },
            ]);

            const filtered = await getFilteredGames(db, { publisherIds: [pubB.id] });
            expect(filtered.map((g) => g.title)).toEqual(['Game B']);
        });

        it('filters games by both category and publisher', async () => {
            const [strategy] = await db
                .insert(categories)
                .values({ name: 'Strategy', description: 's' })
                .returning({ id: categories.id });
            const [action] = await db
                .insert(categories)
                .values({ name: 'Action', description: 'a' })
                .returning({ id: categories.id });
            const [pubA] = await db
                .insert(publishers)
                .values({ name: 'Publisher A', description: 'a' })
                .returning({ id: publishers.id });
            const [pubB] = await db
                .insert(publishers)
                .values({ name: 'Publisher B', description: 'b' })
                .returning({ id: publishers.id });

            await db.insert(games).values([
                {
                    title: 'Strategy A',
                    description: 'desc',
                    categoryId: strategy.id,
                    publisherId: pubA.id,
                },
                {
                    title: 'Strategy B',
                    description: 'desc',
                    categoryId: strategy.id,
                    publisherId: pubB.id,
                },
                {
                    title: 'Action A',
                    description: 'desc',
                    categoryId: action.id,
                    publisherId: pubA.id,
                },
            ]);

            const filtered = await getFilteredGames(db, {
                categoryIds: [strategy.id],
                publisherIds: [pubA.id],
            });
            expect(filtered.map((g) => g.title)).toEqual(['Strategy A']);
        });

        it('supports filtering by multiple categories', async () => {
            const [strategy] = await db
                .insert(categories)
                .values({ name: 'Strategy', description: 's' })
                .returning({ id: categories.id });
            const [action] = await db
                .insert(categories)
                .values({ name: 'Action', description: 'a' })
                .returning({ id: categories.id });
            const [puzzle] = await db
                .insert(categories)
                .values({ name: 'Puzzle', description: 'p' })
                .returning({ id: categories.id });
            const [publisher] = await db
                .insert(publishers)
                .values({ name: 'Pub One', description: 'p' })
                .returning({ id: publishers.id });

            await db.insert(games).values([
                {
                    title: 'Strategy Game',
                    description: 'desc',
                    categoryId: strategy.id,
                    publisherId: publisher.id,
                },
                {
                    title: 'Action Game',
                    description: 'desc',
                    categoryId: action.id,
                    publisherId: publisher.id,
                },
                {
                    title: 'Puzzle Game',
                    description: 'desc',
                    categoryId: puzzle.id,
                    publisherId: publisher.id,
                },
            ]);

            const filtered = await getFilteredGames(db, {
                categoryIds: [strategy.id, action.id],
            });
            expect(filtered.map((g) => g.title)).toEqual(['Action Game', 'Strategy Game']);
        });

        it('returns empty array when no games match filters', async () => {
            await seedGames(db, 2);
            const filtered = await getFilteredGames(db, { categoryIds: [99999] });
            expect(filtered).toEqual([]);
        });
    });
});
