import { getDb } from "./db.js";

// Generations allowed per user per day. Change it with the DAILY_LIMIT env variable.
export const DAILY_LIMIT = Number(process.env.DAILY_LIMIT) || 10;

export type Credit = { allowed: boolean; used: number; limit: number };

/**
 * Uses one credit for today, in a single atomic query:
 * - first request of the day: creates the row with count = 1
 * - next requests: adds 1, but ONLY while count < DAILY_LIMIT
 * When the limit is reached, the WHERE blocks the update and no row comes back.
 * Two requests at the same time can't both slip past the limit.
 */
export async function consumeCredit(uid: string): Promise<Credit> {
  const sql = getDb();
  const rows = await sql<{ count: number }[]>`
    INSERT INTO usage (uid, day, count)
    VALUES (${uid}, CURRENT_DATE, 1)
    ON CONFLICT (uid, day) DO UPDATE
      SET count = usage.count + 1
      WHERE usage.count < ${DAILY_LIMIT}
    RETURNING count
  `;

  if (rows.length === 0) {
    return { allowed: false, used: DAILY_LIMIT, limit: DAILY_LIMIT };
  }
  return { allowed: true, used: rows[0].count, limit: DAILY_LIMIT };
}

/** Gives a credit back when the generation failed (AI error, capture error...). */
export async function refundCredit(uid: string): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE usage SET count = count - 1
    WHERE uid = ${uid} AND day = CURRENT_DATE AND count > 0
  `;
}

/** Today's usage, for the counter in the interface. */
export async function getUsage(uid: string): Promise<{ used: number; limit: number }> {
  const sql = getDb();
  const rows = await sql<{ count: number }[]>`
    SELECT count FROM usage WHERE uid = ${uid} AND day = CURRENT_DATE
  `;
  return { used: rows[0]?.count ?? 0, limit: DAILY_LIMIT };
}