import { handle } from '@/server/http/handle';

/** 헬스 체크용 루트 */
export async function GET() {
  return handle(async () =>
    Response.json({ message: 'Hello from Next API' }),
  );
}
