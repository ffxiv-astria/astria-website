/** Public preview only. Never retain a run, grading data or a server-provided navigation URL. */
export interface ChallengeSharePreview {
  code: string;
  kind: 'player_challenge' | 'player_challenge_same_set';
  status: 'ok' | 'revoked' | 'expired' | 'unavailable';
  title: string;
  subtitle: string | null;
  author: string | null;
  appLink: string | null;
  miniappAvailable: boolean;
}

export interface ShareContext {
  environment: 'browser' | 'desktop' | 'qq' | 'wechat';
  platform: 'android' | 'apple' | 'other';
}

const CODE = /^[0-9A-HJKMNP-TV-Z]{8}$/;

export function readChallengeCode(pathname: string, search: string): string | null {
  const match = /^\/pc\/([^/]+)\/?$/.exec(pathname);
  let raw: string | null;
  try {
    raw = match ? decodeURIComponent(match[1]!) : /^\/pc\/?$/.test(pathname)
      ? new URLSearchParams(search).get('c') : null;
  } catch {
    return null;
  }
  const code = raw?.trim().toUpperCase();
  return code && CODE.test(code) ? code : null;
}

export function detectShareContext(ua: string, platform = '', touchPoints = 0): ShareContext {
  const apple = /iPhone|iPad|iPod|Macintosh/i.test(ua)
    || (platform === 'MacIntel' && touchPoints > 1);
  const device = /Android/i.test(ua) ? 'android' : apple ? 'apple' : 'other';
  return {
    platform: device,
    environment: /MicroMessenger/i.test(ua) ? 'wechat'
      : /\sQQ\//.test(ua) ? 'qq'
        : /Mobile|iPhone|iPad|iPod|Android/i.test(ua) || touchPoints > 1 ? 'browser' : 'desktop',
  };
}

/** Restrict the shared resolver to this domain, and discard extra fields instead of spreading them. */
export function parseChallengeShare(value: unknown, requestedCode: string): ChallengeSharePreview | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const target = source.target as Record<string, unknown> | undefined;
  const preview = source.preview as Record<string, unknown> | null | undefined;
  if (source.code !== requestedCode || !target
    || (target.type !== 'player_challenge' && target.type !== 'player_challenge_same_set')
    || !['ok', 'revoked', 'expired', 'unavailable'].includes(String(source.status))) return null;
  if (source.status === 'ok' && (!preview || typeof preview.title !== 'string')) return null;
  const safeText = (text: unknown) => typeof text === 'string' ? text : null;
  // A same-set app link must preserve this code. Only the ID-addressable challenge route is allowed.
  let appLink: string | null = null;
  if (typeof source.appLink === 'string') {
    try {
      const url = new URL(source.appLink);
      const validId = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url.pathname);
      const sameSet = target.type === 'player_challenge_same_set';
      const validQuery = sameSet
        ? url.searchParams.size === 1 && url.searchParams.get('sameSetCode') === requestedCode
        : !url.search && url.pathname === `/${target.id}`;
      if (url.protocol === 'astria:' && url.hostname === 'player-challenges'
        && validId && validQuery && !url.hash && !url.username && !url.password) appLink = url.href;
    } catch { /* Invalid links are omitted; the web and mini-program fallback remains available. */ }
  }
  return {
    code: requestedCode,
    kind: target.type,
    status: source.status as ChallengeSharePreview['status'],
    title: source.status === 'ok' ? safeText(preview?.title) ?? '' : '',
    subtitle: source.status === 'ok' ? safeText(preview?.subtitle) : null,
    author: source.status === 'ok' ? safeText(preview?.author) : null,
    appLink: source.status === 'ok' ? appLink : null,
    miniappAvailable: source.status === 'ok' && typeof source.miniappPath === 'string' && source.miniappPath.length > 0,
  };
}

export function canOpenAppleApp(context: ShareContext, preview: ChallengeSharePreview): boolean {
  return context.platform === 'apple'
    && (context.environment === 'browser' || context.environment === 'desktop')
    && preview.status === 'ok' && preview.appLink !== null;
}

export function challengeShareUrl(origin: string, code: string): string {
  if (!CODE.test(code)) throw new Error('Invalid challenge share code');
  return new URL(`/pc/${code}`, origin).href;
}
