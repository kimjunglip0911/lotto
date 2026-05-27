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

  return fetch(target, init);
};
