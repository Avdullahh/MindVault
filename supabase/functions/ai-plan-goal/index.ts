import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

type PlanResult = { title: string; deadline: string; priority: 'high' | 'medium' | 'low'; tasks: string[] };

function isValid(v: unknown): v is PlanResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.title !== 'string' || typeof o.deadline !== 'string') return false;
  if (!['high', 'medium', 'low'].includes(o.priority as string)) return false;
  if (isNaN(new Date(o.deadline as string).getTime())) return false;
  if (!Array.isArray(o.tasks) || o.tasks.length < 1) return false;
  return (o.tasks as unknown[]).every((t) => typeof t === 'string');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();
    if (!await checkProEntitlement(authed.userId)) return paymentRequired();

    let body: { goalTitle?: string; context?: string };
    try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
    if (!body.goalTitle?.trim()) return badRequest('goalTitle is required');

    const today = new Date().toISOString().slice(0, 10);
    const raw = await generateText({
      system: 'You are a goal planning assistant. Return only valid JSON and no markdown.',
      prompt: `Plan this goal: "${body.goalTitle.trim()}"${body.context ? `\n\nContext: ${body.context.trim()}` : ''}\n\nToday is ${today}. Respond with JSON:\n{\n  "title": "refined goal title",\n  "deadline": "YYYY-MM-DD",\n  "priority": "high|medium|low",\n  "tasks": ["concrete action task 1", "concrete action task 2"]\n}\n3-6 concrete, actionable tasks a person should do to achieve this goal.`,
      maxTokens: 600,
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
