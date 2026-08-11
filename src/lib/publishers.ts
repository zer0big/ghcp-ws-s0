/**
 * Publisher data-access helpers.
 *
 * These helpers query the SQLite publishers table and return app-facing
 * summary objects that can be consumed by Astro pages and tests without
 * exposing Drizzle row shapes directly.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Return every publisher as a compact summary object containing its unique id
 * and display name, ordered alphabetically by name for deterministic output.
 *
 * @param db - The Drizzle database client used to run the query.
 * @returns A promise resolving to all publishers in name order.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    const rows = await db
        .select({
            id: publishers.id,
            name: publishers.name,
        })
        .from(publishers)
        .orderBy(asc(publishers.name));

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
    }));
}
