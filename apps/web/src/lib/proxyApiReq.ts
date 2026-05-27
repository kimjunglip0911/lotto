import { getApiOrigin } from './apiOrigin';
import { fwdReqHdrs } from './proxyHdrs';

const PROXY_MS = 60_000;

const buildTarget = (pathSegs: string[], search: string): string => {
  const tail = pathSegs.length > 0 ? pathSegs.join('/') : '';
  const qs = search || '';
  return `${getApiOrigin()}/api/${tail}${qs}`;
};

/** /api/* → Nest API (fetch 프록시, http-proxy 미사용) */
export const proxyToApi = async (
  request: Request,
  pathSegs: string[],
): Promise<Response> => {
  const url = new URL(request.url);
  const target = buildTarget(pathSegs, url.search);
  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers: fwdReqHdrs(request),
    signal: AbortSignal.timeout(PROXY_MS),
  };

  if (hasBody) {
    init.body = request.body;
    init.duplex = 'half';
  }

  try {
    return await fetch(target, init);
  } catch (error) {
    const refused =
      error instanceof TypeError &&
      error.cause != null &&
      typeof error.cause === 'object' &&
      'code' in error.cause &&
      (error.cause as { code?: string }).code === 'ECONNREFUSED';

    if (refused) {
      return Response.json(
        { message: 'API server is not reachable. Is Nest running on port 8010?' },
        { status: 503 },
      );
    }
    throw error;
  }
};
