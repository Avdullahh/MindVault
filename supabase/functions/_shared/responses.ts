export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

export const corsPreflight = () => new Response(null, { status: 204, headers: CORS });
export const ok = (body: unknown) => json(body, 200);
export const unauthorised = (msg = 'Unauthorised') => json({ error: msg }, 401);
export const badRequest = (msg: string) => json({ error: msg }, 400);
export const paymentRequired = (msg = 'Pro required') => json({ error: msg }, 402);
export const internalError = (msg = 'Internal error') => json({ error: msg }, 500);
export const badGateway = (msg = 'Model returned unexpected format') => json({ error: msg }, 502);
