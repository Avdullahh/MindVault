import Anthropic from 'npm:@anthropic-ai/sdk';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { ok, unauthorised, badRequest, internalError, badGateway, corsPrelight } from '../_shared/responses.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

type Milestone = { title: string; steps: string[] };
type PlanResult = { title: string; deadline: string; priority: 'high' | 'medium' | 'low'; milestones: Milestone[] };

function isValid(v: unknown): v is PlanResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.title !== 'string' || typeof o.deadline !== 'string') return false;
  if (!['high', 'medium', 'low'].includes(o.priority as string)) return false;
  if (!Array.isArray(o.milestones) || o.milestones.length < 2 || o.milestones.length > 4) return false;
  if (isNaN(new Date(o.deadline as string).getTime())) return false;
  return (o.milestones as unknown[]).every((m) => {
    if (typeof m !== 'object' || m === null) return false;
    const ms = m as Record<string, unknown>;
    return (
      typeof ms.title === 'string' &&
      Array.isArray(ms.steps) &&
      (ms.steps as unknown[]).length >= 2 &&
      (ms.steps as unknown[]).length <= 3 &&
      (ms.steps as unknown[]).every((s) => typeof s === 'string')
    );
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPrelight();

  const authed = await getAuthedClient(req);
  if (!authed) return unauthorised();
  if (!await checkProEntitlement(authed.userId)) return unauthorised();

  let body: { goalTitle?: string };
  try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
  if (!body.goalTitle?.trim()) return badRequest('goalTitle is required');

  const today = new Date().toISOString().slice(0, 10);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a goal planning assistant. Always respond with valid JSON only, no markdown, no prose.',
      messages: [{
        role: 'user',
        content: `Plan this goal: "${body.goalTitle}"\n\nToday is ${today}. Respond with JSON:\n{\n  "title": "refined goal title",\n  "deadline": "YYYY-MM-DD",\n  "priority": "high|medium|low",\n  "milestones": [{ "title": "milestone", "steps": ["step 1", "step 2"] }]\n}\n2-4 milestones, 2-3 steps each.`,
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
