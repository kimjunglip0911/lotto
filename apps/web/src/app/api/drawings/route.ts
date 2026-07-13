import { handle } from '@/server/http/handle';
import * as drawings from '@/server/home/drawings';

export async function GET() {
  return handle(async () => Response.json(await drawings.getDrawings()));
}
