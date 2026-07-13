import 'server-only';
import { Pool } from 'pg';

type GlobalPg = typeof globalThis & { __pg?: Pool };

/** Vercel·HMR에서 Pool 재생성 방지용 싱글톤 */
export function getPool(): Pool {
  const g = globalThis as GlobalPg;
  if (!g.__pg) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error('DATABASE_URL is required');
    g.__pg = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return g.__pg;
}
