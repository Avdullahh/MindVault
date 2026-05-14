import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

type Resurface = { title: string; description: string };
type BriefResult = { greeting: string; events: string[]; resurface: Resurface | null };

function isValid(v: unknown): v is BriefResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.greeting !== 'string') return false;
  if (!Array.isArray(o.events) || !(o.events as unknown[]).every((e) => typeof e === 'string')) return false;
  if (o.resurface !== null && o.resurface !== undefined) {
    if (typeof o.resurface !== 'object') return false;
    const r = o.resurface as Record<string, unknown>;
    if (typeof r.title !== 'string' || typeof r.description !== 'string') return false;
  }
  return true;
}

// Returns UTC ISO strings for the start and end of the user's local day.
function localDayBoundsUTC(timezone: string): { start: string; end: string; localDate: string } {
  const now = new Date();
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);

  const midnightProxy = new Date(`${localDate}T00:00:00Z`);
  const localTimeOfProxy = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(midnightProxy);

  const [h, m, s] = localTimeOfProxy.split(':').map(Number);
  const offsetMs = (h * 3600 + m * 60 + s) * 1000;

  const dateAtProxy = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(midnightProxy);
  const startMs = dateAtProxy === localDate
    ? midnightProxy.getTime() - offsetMs
    : midnightProxy.getTime() + (86400 * 1000 - offsetMs);
  return {
    localDate,
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 86400 * 1000).toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();
    if (!await checkProEntitlement(authed.userId)) return paymentRequired();

    let body: { timezone?: string } = {};
    try { body = await req.json(); } catch { /* body is optional */ }

    const timezone = typeof body.timezone === 'string' ? body.timezone : 'UTC';
    let bounds: { localDate: string; start: string; end: string };
    try {
      bounds = localDayBoundsUTC(timezone);
    } catch {
      return badRequest('Invalid timezone');
    }
    const { localDate, start, end } = bounds;

    const [{ data: events, error: eventsError }, { data: ideas, error: ideasError }] = await Promise.all([
      authed.client
        .from('calendar_events')
        .select('title')
        .gte('start_at', start)
        .lt('start_at', end)
        .order('start_at', { ascending: true }),
      authed.client
        .from('ideas')
        .select('title, description')
        .order('last_viewed_at', { ascending: true, nullsFirst: true })
        .limit(1),
    ]);

    if (eventsError || ideasError) {
      console.error('Failed to load brief context', eventsError ?? ideasError);
      return internalError('Failed to load brief context');
    }

    const eventTitles = (events ?? []).map((e: { title: string }) => e.title);
    const resurface = (ideas ?? [])[0] as { title: string; description: string | null } | undefined;
    const raw = await generateText({
      system: 'You are a personal assistant writing a brief morning summary. Return only valid JSON and no markdown.',
      prompt: `Today is ${localDate}.\n\nCalendar events: ${eventTitles.length > 0 ? eventTitles.join(', ') : 'none'}\n\nIdea to resurface: ${resurface ? `"${resurface.title}"${resurface.description ? ` - ${resurface.description}` : ''}` : 'none'}\n\nRespond with JSON:\n{ "greeting": "short morning greeting", "events": ["one bullet per event"], "resurface": { "title": "idea title", "description": "one-sentence teaser" } or null }`,
      maxTokens: 800,
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
