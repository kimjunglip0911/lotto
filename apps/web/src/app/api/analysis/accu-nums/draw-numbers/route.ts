import * as h from '@/server/analysis/accu-nums/handlers';
import { handle } from '@/server/http/handle';

export async function GET() {
  return handle(() => h.getDrawNumbers());
}
