import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, corsPreflight, internalError, ok, paymentRequired, quotaExceeded, unauthorised } from '../_shared/responses.ts';
import { refundAiUsage, reserveAiUsage } from '../_shared/usage.ts';
import { clamp, MAX_TITLE_LENGTH } from '../_shared/validation.ts';

type TargetType = 'idea' | 'goal' | 'project';

// A candidate is built entirely from our own DB reads -- title/type/id are
// never trusted from the model. Gemini only picks one (by number) and
// writes the reason/CTA copy, so it can't hallucinate a target that
// doesn't exist or belongs to someone else.
type Candidate = { type: TargetType; id: string; title: string; fact: string; score: number };

type Move = {
  targetType: TargetType;
  targetId: string;
  title: string;
  reason: string;
  ctaLabel: string;
  logId: string | null;
};
type BriefResult = { greeting: string; move: Move | null };

// What the model actually returns: a 1-indexed pick into the candidate list
// we sent it (or null if nothing was worth surfacing), plus its copy.
type ModelPick = { greeting: string; choice: number | null; reason: string; ctaLabel: string };

function isValidPick(v: unknown): v is ModelPick {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.greeting !== 'string') return false;
  if (o.choice !== null && !(typeof o.choice === 'number' && Number.isInteger(o.choice))) return false;
  if (typeof o.reason !== 'string' || typeof o.ctaLabel !== 'string') return false;
  return true;
}

const DAY_MS = 86_400_000;
const daysSince = (iso: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / DAY_MS : null);

const CTA_BY_TYPE: Record<TargetType, string> = { idea: 'Open idea', goal: 'Review goal', project: 'Open project' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();
    if (!await checkProEntitlement(authed.userId)) return paymentRequired();

    const [ideasRes, goalsRes, projectsRes, tasksRes, goalIdeasRes, projectIdeasRes, recentLogRes] = await Promise.all([
      authed.client.from('ideas').select('id, title, last_viewed_at').order('last_viewed_at', { ascending: true, nullsFirst: true }).limit(30),
      authed.client.from('goals').select('id, title, deadline, priority'),
      authed.client.from('projects').select('id, title'),
      authed.client.from('tasks').select('id, project_id').eq('done', false).not('project_id', 'is', null),
      authed.client.from('goal_ideas').select('goal_id, idea_id'),
      authed.client.from('project_ideas').select('project_id, idea_id'),
      authed.client.from('morning_brief_log').select('target_type, target_id')
        .gte('created_at', new Date(Date.now() - 5 * DAY_MS).toISOString()),
    ]);

    const firstError = ideasRes.error || goalsRes.error || projectsRes.error || tasksRes.error
      || goalIdeasRes.error || projectIdeasRes.error || recentLogRes.error;
    if (firstError) {
      console.error('Failed to load brief context', firstError);
      return internalError('Failed to load brief context');
    }

    const ideas = ideasRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const openTasks = tasksRes.data ?? [];
    const recentTargets = new Set((recentLogRes.data ?? []).map((r) => `${r.target_type}:${r.target_id}`));

    const goalTitleById = new Map(goals.map((g) => [g.id, g.title]));
    const projectTitleById = new Map(projects.map((p) => [p.id, p.title]));

    const goalsByIdea = new Map<string, string[]>();
    for (const gi of goalIdeasRes.data ?? []) {
      const title = goalTitleById.get(gi.goal_id);
      if (!title) continue;
      goalsByIdea.set(gi.idea_id, [...(goalsByIdea.get(gi.idea_id) ?? []), title]);
    }
    const projectsByIdea = new Map<string, string[]>();
    for (const pi of projectIdeasRes.data ?? []) {
      const title = projectTitleById.get(pi.project_id);
      if (!title) continue;
      projectsByIdea.set(pi.idea_id, [...(projectsByIdea.get(pi.idea_id) ?? []), title]);
    }

    const candidates: Candidate[] = [];

    // Ideas linked to a goal/project that have gone stale -- the "call to
    // action with reasoning" case: something you already connected to a
    // bigger thing, sitting untouched.
    for (const idea of ideas) {
      const linkedGoals = goalsByIdea.get(idea.id) ?? [];
      const linkedProjects = projectsByIdea.get(idea.id) ?? [];
      if (linkedGoals.length === 0 && linkedProjects.length === 0) continue;
      const stale = daysSince(idea.last_viewed_at);
      const staleDays = stale === null ? 999 : Math.floor(stale);
      if (staleDays < 3) continue;
      const linkPart = linkedGoals[0] ? `linked to your goal "${linkedGoals[0]}"` : `linked to your project "${linkedProjects[0]}"`;
      const staleness = stale === null ? 'never revisited since capture' : `not viewed in ${staleDays} days`;
      candidates.push({ type: 'idea', id: idea.id, title: idea.title, fact: `${linkPart}; ${staleness}`, score: 40 + Math.min(staleDays, 60) });
    }

    // Projects with open, unfinished work waiting.
    const openTaskCountByProject = new Map<string, number>();
    for (const t of openTasks) {
      if (!t.project_id) continue;
      openTaskCountByProject.set(t.project_id, (openTaskCountByProject.get(t.project_id) ?? 0) + 1);
    }
    for (const project of projects) {
      const count = openTaskCountByProject.get(project.id) ?? 0;
      if (count === 0) continue;
      candidates.push({ type: 'project', id: project.id, title: project.title, fact: `${count} open task${count === 1 ? '' : 's'} waiting`, score: 50 + Math.min(count, 20) });
    }

    // Goals with a deadline coming up or already missed.
    for (const goal of goals) {
      if (!goal.deadline) continue;
      const daysUntil = (new Date(goal.deadline).getTime() - Date.now()) / DAY_MS;
      if (daysUntil > 14) continue;
      const deadlinePart = daysUntil < 0
        ? `deadline passed ${Math.abs(Math.round(daysUntil))} day(s) ago`
        : `deadline in ${Math.max(Math.round(daysUntil), 0)} day(s)`;
      const fact = goal.priority ? `${deadlinePart}; priority ${goal.priority}` : deadlinePart;
      candidates.push({ type: 'goal', id: goal.id, title: goal.title, fact, score: daysUntil < 0 ? 100 + Math.abs(Math.round(daysUntil)) : 90 - daysUntil });
    }

    // Fallback: today's original behavior (least-recently-viewed idea),
    // only used when nothing richer qualifies.
    if (candidates.length === 0 && ideas.length > 0) {
      const fallback = ideas[0];
      candidates.push({
        type: 'idea',
        id: fallback.id,
        title: fallback.title,
        fact: fallback.last_viewed_at ? 'not viewed in a while' : 'never revisited since capture',
        score: 10,
      });
    }

    const notRecentlyShown = candidates.filter((c) => !recentTargets.has(`${c.type}:${c.id}`));
    const pool = (notRecentlyShown.length > 0 ? notRecentlyShown : candidates)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    let body: { timezone?: string } = {};
    try { body = await req.json(); } catch { /* no body is fine, fall back to UTC */ }

    // Intl throws RangeError on an unrecognised IANA zone -- fall back to
    // UTC rather than 500ing the whole brief over a bad client-supplied
    // string.
    let today: string;
    try {
      today = new Intl.DateTimeFormat('en-CA', { timeZone: body.timezone || 'UTC' }).format(new Date());
    } catch {
      today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date());
    }

    const reservation = await reserveAiUsage(authed.client);
    if (!reservation.allowed) return quotaExceeded(reservation);

    const candidateLines = pool.length > 0
      ? pool.map((c, i) => `${i + 1}. [${c.type}] "${clamp(c.title, MAX_TITLE_LENGTH)}" — ${c.fact}`).join('\n')
      : 'none';

    let raw: string;
    try {
      raw = await generateText({
        system: 'You are a personal assistant helping the user decide what to focus on today. You will be given a numbered list of candidate items with factual context about them. Pick exactly one candidate that is genuinely worth acting on today and explain why in one or two sentences, using only the given facts -- never invent context. Return only valid JSON and no markdown.',
        prompt: `Today is ${today}.\n\nCandidates:\n${candidateLines}\n\nRespond with JSON:\n{ "greeting": "short morning greeting", "choice": <candidate number, or null if none are worth surfacing>, "reason": "one or two sentences grounded in the facts above explaining why this is worth doing today", "ctaLabel": "short action label, e.g. Open idea" }`,
        maxTokens: 400,
      });
    } catch (err) {
      if (err instanceof GeminiRequestError) await refundAiUsage(authed.client);
      throw err;
    }

    let parsed: unknown;
    try { parsed = parseJsonObject(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValidPick(parsed)) return badGateway();

    const picked = parsed.choice !== null && parsed.choice >= 1 && parsed.choice <= pool.length
      ? pool[parsed.choice - 1]
      : null;

    let move: Move | null = null;
    if (picked) {
      const { data: logRow, error: logError } = await authed.client
        .from('morning_brief_log')
        .insert({
          user_id: authed.userId,
          target_type: picked.type,
          target_id: picked.id,
          reason: clamp(parsed.reason, MAX_TITLE_LENGTH) ?? '',
        })
        .select('id')
        .single();
      if (logError) console.error('morning_brief_log insert failed', logError);

      move = {
        targetType: picked.type,
        targetId: picked.id,
        title: picked.title,
        reason: clamp(parsed.reason, MAX_TITLE_LENGTH) || picked.fact,
        ctaLabel: clamp(parsed.ctaLabel, MAX_TITLE_LENGTH) || CTA_BY_TYPE[picked.type],
        logId: logRow?.id ?? null,
      };
    }

    const result: BriefResult = { greeting: parsed.greeting, move };
    return ok(result, reservation);
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiRequestError) return badGateway(e.message);
    return internalError();
  }
});
