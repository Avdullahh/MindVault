import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

type Resurface = { title: string; description: string };
type BriefResult = { greeting: string; resurface: Resurface | null };

function isValid(v: unknown): v is BriefResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.greeting !== 'string') return false;
  if (o.resurface !== null && o.resurface !== undefined) {
    if (typeof o.resurface !== 'object') return false;
    const r = o.resurface as Record<string, unknown>;
    if (typeof r.title !== 'string' || typeof r.description !== 'string') return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();
    if (!await checkProEntitlement(authed.userId)) return paymentRequired();

    // Pull a small batch of the least-recently-viewed ideas (never-viewed
    // ones first) and pick one at random, rather than always the single
    // least-recent — otherwise every never-viewed idea ties on
    // last_viewed_at IS NULL and the same one (lowest insertion order) gets
    // resurfaced every time.
    const { data: ideas, error: ideasError } = await authed.client
      .from('ideas')
      .select('title, description')
      .order('last_viewed_at', { ascending: true, nullsFirst: true })
      .limit(5);

    if (ideasError) {
      console.error('Failed to load brief context', ideasError);
      return internalError('Failed to load brief context');
    }

    const candidates = (ideas ?? []) as { title: string; description: string | null }[];
    const resurface = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : undefined;

    let body: { timezone?: string } = {};
    try { body = await req.json(); } catch { /* no body is fine, fall back to UTC */ }

    // Intl throws RangeError on an unrecognised IANA zone — fall back to UTC
    // rather than 500ing the whole brief over a bad client-supplied string.
    let today: string;
    try {
      today = new Intl.DateTimeFormat('en-CA', { timeZone: body.timezone || 'UTC' }).format(new Date());
    } catch {
      today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date());
    }
    const raw = await generateText({
      system: 'You are a personal assistant writing a brief morning summary. Return only valid JSON and no markdown.',
      prompt: `Today is ${today}.\n\nIdea to resurface: ${resurface ? `"${resurface.title}"${resurface.description ? ` - ${resurface.description}` : ''}` : 'none'}\n\nRespond with JSON:\n{ "greeting": "short morning greeting", "resurface": { "title": "idea title", "description": "one-sentence teaser" } or null }`,
      maxTokens: 400,
    });

    let parsed: unknown;
    try { parsed = parseJsonObject(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValid(parsed)) return badGateway();
    return ok(parsed);
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiRequestError) return badGateway(e.message);
    return internalError();
  }
});
