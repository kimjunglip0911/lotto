import * as h from '@/server/analysis/accu-nums/handlers';
import { handle } from '@/server/http/handle';

export async function GET(req: Request) {
  return handle(() => h.getWinningNumber(new URL(req.url)));
}
