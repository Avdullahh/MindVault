import Anthropic from 'npm:@anthropic-ai/sdk';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { ok, unauthorised, internalError, badGateway, corsPrelight } from '../_shared/responses.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

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

  // Find what UTC time corresponds to midnight in the user's timezone.
  // Take midnight UTC of that date as a proxy, then adjust by the local offset.
  const midnightProxy = new Date(`${localDate}T00:00:00Z`);
  const localTimeOfProxy = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(midnightProxy); // e.g. "05:00:00" for UTC+5

  const [h, m, s] = localTimeOfProxy.split(':').map(Number);
  const offsetMs = (h * 3600 + m * 60 + s) * 1000;

  // Check what local DATE the proxy (midnight UTC) falls on.
  // If it matches localDate, the timezone is east of UTC → local midnight is before UTC midnight → subtract.
  // If it doesn't match (it's the previous local day), the timezone is west of UTC → add the remainder.
  // This correctly handles UTC+12, +13, +14 where h >= 12 but the date still matches.
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
  if (req.method === 'OPTIONS') return corsPrelight();

  const authed = await getAuthedClient(req);
  if (!authed) return unauthorised();
  if (!await checkProEntitlement(authed.userId)) return unauthorised();

  let body: { timezone?: string } = {};
  try { body = await req.json(); } catch { /* body is optional */ }

  const timezone = typeof body.timezone === 'string' ? body.timezone : 'UTC';
  const { localDate, start, end } = localDayBoundsUTC(timezone);

  const [{ data: events }, { data: ideas }] = await Promise.all([
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

  const eventTitles = (events ?? []).map((e: { title: string }) => e.title);
  const resurface = (ideas ?? [])[0] as { title: string; description: string | null } | undefined;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are a personal assistant writing a brief morning summary. Always respond with valid JSON only, no markdown, no prose.',
      messages: [{
        role: 'user',
        content: `Today is ${localDate}.\n\nCalendar events: ${eventTitles.length > 0 ? eventTitles.join(', ') : 'none'}\n\nIdea to resurface: ${resurface ? `"${resurface.title}"` : 'none'}\n\nRespond with JSON:\n{ "greeting": "short morning greeting", "events": ["one bullet per event"], "resurface": { "title": "idea title", "description": "one-sentence teaser" } or null }`,
      }],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValid(parsed)) return badGateway();
    return ok(parsed);
  } catch {
    return internalError();
  }
});
