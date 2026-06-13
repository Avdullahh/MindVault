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

    const { data: ideas, error: ideasError } = await authed.client
      .from('ideas')
      .select('title, description')
      .order('last_viewed_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (ideasError) {
      console.error('Failed to load brief context', ideasError);
      return internalError('Failed to load brief context');
    }

    const resurface = (ideas ?? [])[0] as { title: string; description: string | null } | undefined;
    const today = new Intl.DateTimeFormat('en-CA').format(new Date());
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
