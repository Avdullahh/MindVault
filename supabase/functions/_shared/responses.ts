import type { UsageSnapshot } from './usage.ts';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

export const corsPreflight = () => new Response(null, { status: 204, headers: CORS });

// `usage` is spread onto the response as a `usage` field when given, so the
// client can update its displayed quota without a separate round-trip. An
// absent `usage` means "don't touch cached usage state" -- e.g. a path that
// never called Gemini and never reserved quota.
export const ok = (body: Record<string, unknown>, usage?: UsageSnapshot) =>
  json(usage ? { ...body, usage } : body, 200);

export const unauthorised = (msg = 'Unauthorised') => json({ error: msg }, 401);
export const badRequest = (msg: string) => json({ error: msg }, 400);
export const paymentRequired = (msg = 'Pro required') => json({ error: msg }, 402);
export const quotaExceeded = (usage: UsageSnapshot) => json({ error: 'AI usage limit reached', usage }, 429);
export const internalError = (msg = 'Internal error') => json({ error: msg }, 500);
export const badGateway = (msg = 'Model returned unexpected format') => json({ error: msg }, 502);
