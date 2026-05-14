export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const corsPrelight = () => new Response('ok', { status: 200, headers: CORS });
export const ok = (body: unknown) => Response.json(body, { status: 200, headers: CORS });
export const unauthorised = () => Response.json({ error: 'Unauthorised' }, { status: 401, headers: CORS });
export const badRequest = (msg: string) => Response.json({ error: msg }, { status: 400, headers: CORS });
export const paymentRequired = () => Response.json({ error: 'Pro required' }, { status: 402, headers: CORS });
export const internalError = (msg = 'Internal error') => Response.json({ error: msg }, { status: 500, headers: CORS });
export const badGateway = (msg = 'Model returned unexpected format') => Response.json({ error: msg }, { status: 502, headers: CORS });
