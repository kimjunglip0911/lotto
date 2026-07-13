import { HttpError } from './error';

/** 필수 정수 쿼리. 없거나 NaN이면 400 */
export function requireInt(value: string | null, name: string): number {
  if (value == null || value === '') {
    throw new HttpError(400, `${name} is required`);
  }
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) {
    throw new HttpError(400, `${name} must be an integer`);
  }
  return n;
}

export function optionalInt(value: string | null): number | undefined {
  if (value == null || value === '') return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}
