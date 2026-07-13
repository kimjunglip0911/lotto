/**
 * migrate-dump.json → Supabase Postgres 이관.
 * 실행: npm run db:migrate -w api (DATABASE_URL 필요)
 */
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { importDump } from './migrate-import';

config({ path: join(__dirname, '..', '..', '.env') });

function dumpPath(): string {
  const cand = [
    join(process.cwd(), 'data', 'migrate-dump.json'),
    join(__dirname, '..', '..', 'data', 'migrate-dump.json'),
  ];
  for (const p of cand) if (existsSync(p)) return p;
  throw new Error('migrate-dump.json not found — export SQLite first');
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is required');
  const dump = JSON.parse(readFileSync(dumpPath(), 'utf8')) as {
    winners: Record<string, unknown>[];
    drawings: Record<string, unknown>[];
    snaps: Record<string, unknown>[];
  };
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await importDump(pool, dump);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
