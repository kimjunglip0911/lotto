import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';

type Row = Record<string, unknown>;

/** Supabase Postgres 연결 풀. DATABASE_URL 필수. */
@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  onModuleInit(): void {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async fetchAll(sql: string, params: unknown[] = []): Promise<Row[]> {
    const res = await this.pool.query<QueryResultRow>(sql, params);
    return res.rows as Row[];
  }

  async fetchOne(sql: string, params: unknown[] = []): Promise<Row | undefined> {
    return (await this.fetchAll(sql, params))[0];
  }

  async run(sql: string, params: unknown[] = []): Promise<void> {
    await this.pool.query(sql, params);
  }

  async withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
