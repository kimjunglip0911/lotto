import { Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { Mutex } from 'async-mutex';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

type Row = Record<string, unknown>;

@Injectable()
export class SqliteService implements OnModuleInit {
  private schemaReady = false;
  private readonly mutex = new Mutex();

  onModuleInit(): void {
    const dir = dirname(this.getDbPath());
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.withDb(() => undefined);
  }

  getDbPath(): string {
    const override = process.env.LOTTO_DB_PATH?.trim();
    if (override) {
      return override;
    }
    const candidates = [
      join(process.cwd(), 'data', 'lotto.db'),
      join(process.cwd(), 'apps', 'api', 'data', 'lotto.db'),
      join(__dirname, '..', '..', 'data', 'lotto.db'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        return p;
      }
    }
    return join(process.cwd(), 'data', 'lotto.db');
  }

  async withDb<T>(fn: (db: Database.Database) => T): Promise<T> {
    return this.mutex.runExclusive(() => {
      const db = new Database(this.getDbPath(), { timeout: 60000 });
      try {
        db.pragma('busy_timeout = 30000');
        try {
          db.pragma('journal_mode = WAL');
        } catch {
          /* ignore */
        }
        this.ensureSchema(db);
        return fn(db);
      } finally {
        db.close();
      }
    });
  }

  async withDbRetry<T>(
    fn: (db: Database.Database) => T,
    attempts = 15,
    baseDelaySec = 0.2,
  ): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < Math.max(1, attempts); i++) {
      try {
        return await this.withDb(fn);
      } catch (err) {
        if (!this.isTransientLock(err) || i === attempts - 1) {
          throw err;
        }
        lastErr = err;
        await new Promise((r) => setTimeout(r, baseDelaySec * (1 + i) * 1000));
      }
    }
    throw lastErr;
  }

  fetchAll(sql: string, params: unknown[] = []): Promise<Row[]> {
    return this.withDb((db) => db.prepare(sql).all(...params) as Row[]);
  }

  fetchOne(sql: string, params: unknown[] = []): Promise<Row | undefined> {
    return this.withDb((db) => {
      const row = db.prepare(sql).get(...params) as Row | undefined;
      return row;
    });
  }

  run(sql: string, params: unknown[] = [], commit = false): Promise<void> {
    return this.withDb((db) => {
      db.prepare(sql).run(...params);
      if (commit) {
        /* better-sqlite3 auto-commit per statement unless transaction */
      }
    });
  }

  async runHandler<T>(
    handler: (db: Database.Database) => T,
    commit = false,
  ): Promise<T> {
    return this.withDb((db) => {
      const result = handler(db);
      if (commit) {
        /* statements already committed */
      }
      return result;
    });
  }

  private isTransientLock(err: unknown): boolean {
    const msg = String(err).toLowerCase();
    return msg.includes('locked') || msg.includes('busy');
  }

  private resolveSchemaPath(): string {
    const candidates = [
      join(process.cwd(), 'src', 'db', 'schema.sql'),
      join(__dirname, 'schema.sql'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        return p;
      }
    }
    throw new Error('schema.sql not found');
  }

  private ensureSchema(db: Database.Database): void {
    if (this.schemaReady) {
      return;
    }
    const script = readFileSync(this.resolveSchemaPath(), 'utf-8');
    db.exec(script);

    const drawingCols = db
      .prepare('PRAGMA table_info(lotto_drawings)')
      .all() as { name: string }[];
    const colNames = new Set(drawingCols.map((c) => c.name));
    if (!colNames.has('strategy')) {
      db.exec('ALTER TABLE lotto_drawings ADD COLUMN strategy TEXT');
    }

    const snapExists = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='accumulated_number_snapshots'",
      )
      .get() as { name: string } | undefined;
    if (snapExists) {
      const snapCols = db
        .prepare('PRAGMA table_info(accumulated_number_snapshots)')
        .all() as { name: string }[];
      const snapNames = new Set(snapCols.map((c) => c.name));
      if (snapNames.has('payload_json') && !snapNames.has('final_num1')) {
        db.exec('DROP TABLE accumulated_number_snapshots');
        db.exec(`
          CREATE TABLE accumulated_number_snapshots (
            anchor_draw_no INTEGER PRIMARY KEY,
            schema_version INTEGER NOT NULL,
            final_num1 INTEGER NOT NULL,
            final_num2 INTEGER NOT NULL,
            final_num3 INTEGER NOT NULL,
            final_num4 INTEGER NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `);
      }
    }

    this.schemaReady = true;
  }
}
