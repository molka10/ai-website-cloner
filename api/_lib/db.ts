import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

// Reuse one connection pool across requests (serverless functions stay warm).
const globalForDb = globalThis as unknown as { sql?: Sql };

export function getDb(): Sql {
  if (globalForDb.sql) return globalForDb.sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("The server is missing its DATABASE_URL.");
  }

  globalForDb.sql = postgres(url, {
    max: 5,            // small pool: enough for local dev and serverless
    idle_timeout: 20,  // close idle connections after 20 s
    connect_timeout: 10,
    prepare: false,    // required by Neon's connection pooler (harmless locally)
  });

  return globalForDb.sql;
}