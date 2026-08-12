/**
 * Category data-access helpers.
 *
 * These helpers query the SQLite categories table and return app-facing
 * summary objects that can be consumed by Astro pages and tests without
 * exposing Drizzle row shapes directly.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';

/**
 * Return every category as a compact summary object containing its unique id
 * and display name, ordered alphabetically by name for deterministic output.
 *
 * @param db - The Drizzle database client used to run the query.
 * @returns A promise resolving to all categories in name order.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    const rows = await db
        .select({
            id: categories.id,
            name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
    }));
}
