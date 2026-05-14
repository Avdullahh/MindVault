import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

type PlanResult = { tasks: string[] };

function isValid(v: unknown): v is PlanResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
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

    const raw = await generateText({
      system: 'You are a project planning assistant. Return only valid JSON and no markdown.',
      prompt: `Generate concrete tasks for this project: "${body.goalTitle.trim()}"${body.context ? `\n\nContext: ${body.context.trim()}` : ''}\n\nRespond with JSON:\n{\n  "tasks": ["specific action task 1", "specific action task 2"]\n}\n3-6 specific, actionable tasks a person should do to move this project forward.`,
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
