import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, quotaExceeded, unauthorised } from '../_shared/responses.ts';
import { clamp, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH } from '../_shared/validation.ts';
import { refundAiUsage, reserveAiUsage } from '../_shared/usage.ts';

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

    let body: { goalTitle?: string; context?: string; projectId?: string };
    try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

    const goalTitle = clamp(body.goalTitle?.trim(), MAX_TITLE_LENGTH);
    const context = clamp(body.context?.trim(), MAX_TEXT_LENGTH);
    const projectId = body.projectId?.trim();
    if (!goalTitle) return badRequest('goalTitle is required');

    const reservation = await reserveAiUsage(authed.client);
    if (!reservation.allowed) return quotaExceeded(reservation);

    let raw: string;
    try {
      raw = await generateText({
        system: 'You are a project planning assistant. Return only valid JSON and no markdown.',
        prompt: `Generate concrete tasks for this project: "${goalTitle}"${context ? `\n\nContext: ${context}` : ''}\n\nRespond with JSON:\n{\n  "tasks": ["specific action task 1", "specific action task 2"]\n}\n3-6 specific, actionable tasks a person should do to move this project forward.`,
        maxTokens: 400,
      });
    } catch (err) {
      if (err instanceof GeminiRequestError) await refundAiUsage(authed.client);
      throw err;
    }

    let parsed: unknown;
    try { parsed = parseJsonObject(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValid(parsed)) return badGateway();

    if (projectId) {
      const { error: insertError } = await authed.client.from('project_plans').insert({
        project_id: projectId,
        tasks: parsed.tasks,
      });
      // Best-effort: history is supplementary, never blocks returning the
      // plan result the user is waiting on. RLS also rejects a projectId
      // that isn't the caller's, which lands here rather than failing the
      // request.
      if (insertError) console.error('project_plans insert failed', insertError);
    }

    return ok(parsed, reservation);
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiRequestError) return badGateway(e.message);
    return internalError();
  }
});
