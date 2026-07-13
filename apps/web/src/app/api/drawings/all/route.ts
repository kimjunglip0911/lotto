import { handle } from '@/server/http/handle';
import * as drawings from '@/server/home/drawings';

export async function DELETE() {
  return handle(async () => Response.json(await drawings.deleteAll()));
}
