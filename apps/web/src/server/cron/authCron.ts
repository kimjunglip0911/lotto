import 'server-only';

/** Vercel Cron Authorization: Bearer CRON_SECRET 검증 */

export const isCronAuthorized = (request: Request): boolean => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
};
