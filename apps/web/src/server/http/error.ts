/** Route Handler에서 JSON으로 변환하는 HTTP 오류 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function jsonError(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ message: err.message }, { status: err.status });
  }
  const msg = err instanceof Error ? err.message : String(err);
  return Response.json({ message: msg }, { status: 500 });
}
