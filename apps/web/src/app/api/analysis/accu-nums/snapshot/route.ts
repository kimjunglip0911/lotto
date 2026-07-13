import * as h from '@/server/analysis/accu-nums/handlers';
import { handle } from '@/server/http/handle';

export async function GET(req: Request) {
  return handle(() => h.getSnapshot(new URL(req.url)));
}

export async function POST(req: Request) {
  return handle(() => h.postSnapshot(req));
}
