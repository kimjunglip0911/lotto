import 'server-only';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from './pool';

type Row = Record<string, unknown>;

export async function fetchAll(
  sql: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const res = await getPool().query<QueryResultRow>(sql, params);
  return res.rows as Row[];
}

export async function fetchOne(
  sql: string,
  params: unknown[] = [],
): Promise<Row | undefined> {
  return (await fetchAll(sql, params))[0];
}

export async function run(
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  await getPool().query(sql, params);
}

export async function withTx<T>(
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
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
