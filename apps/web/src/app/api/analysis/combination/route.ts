import { handle } from '@/server/http/handle';
import { getComboBands } from '@/server/analysis/combination/handlers';

export async function GET() {
  return handle(() => getComboBands());
}
