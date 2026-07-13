import { jsonError } from '@/server/http/error';

/** Route Handler용 try/catch 래퍼 */
export async function handle(
  fn: () => Promise<Response> | Response,
): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    return jsonError(err);
  }
}
