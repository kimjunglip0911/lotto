import { handle } from '@/server/http/handle';
import { isCronAuthorized } from '@/server/cron/authCron';
import { pingDb } from '@/server/cron/pingDb';

/** 매일 Cron이 호출해 DB를 깨운다 */

export async function GET(request: Request) {
  return handle(async () => {
    if (!isCronAuthorized(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json(await pingDb());
  });
}
