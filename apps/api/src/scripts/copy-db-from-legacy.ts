/**
 * 이전 경로의 lotto.db → apps/api/data/lotto.db 복사 및 행 수 검증
 * 실행: npm run db:copy -w api
 */
import Database from 'better-sqlite3';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const apiRoot = join(__dirname, '..', '..');
const legacyCandidates = [
  join(apiRoot, 'src', 'db', 'data', 'lotto.db'),
  join(apiRoot, '..', '..', 'backend', 'DB', 'lotto.db'),
];
const targetDir = join(apiRoot, 'data');
const target = join(targetDir, 'lotto.db');

const countTables = (dbPath: string): Record<string, number> => {
  if (!existsSync(dbPath)) {
    return {};
  }
  const db = new Database(dbPath, { readonly: true });
  const tables = ['lotto_winners', 'lotto_drawings', 'accumulated_number_snapshots'];
  const out: Record<string, number> = {};
  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number };
      out[t] = row.c;
    } catch {
      out[t] = -1;
    }
  }
  db.close();
  return out;
};

mkdirSync(targetDir, { recursive: true });

const legacy = legacyCandidates.find((p) => existsSync(p));
if (legacy) {
  copyFileSync(legacy, target);
  console.log(`Copied: ${legacy} -> ${target}`);
} else {
  console.log('No legacy DB found; new DB will be created on API start.');
}

const before = legacy ? countTables(legacy) : {};
const after = countTables(target);
console.log('Counts source:', before);
console.log('Counts target:', after);
