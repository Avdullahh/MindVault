import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, quotaExceeded, unauthorised } from '../_shared/responses.ts';
import { clamp, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH } from '../_shared/validation.ts';
import { refundAiUsage, reserveAiUsage } from '../_shared/usage.ts';

type ExpandResult = { questions: string[]; angles: string[]; related: string[] };

function isValid(v: unknown): v is ExpandResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  const isStringArray = (a: unknown) => Array.isArray(a) && (a as unknown[]).every((x) => typeof x === 'string');
  return isStringArray(o.questions) && isStringArray(o.angles) && isStringArray(o.related);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();

  try {
    const authed = await getAuthedClient(req);
    if (!authed) return unauthorised();
    if (!await checkProEntitlement(authed.userId)) return paymentRequired();

    let body: { ideaTitle?: string; ideaDescription?: string; ideaId?: string };
    try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

    const ideaTitle = clamp(body.ideaTitle?.trim(), MAX_TITLE_LENGTH);
    const ideaDescription = clamp(body.ideaDescription?.trim(), MAX_TEXT_LENGTH);
    const ideaId = body.ideaId?.trim();
    if (!ideaTitle) return badRequest('ideaTitle is required');

    const reservation = await reserveAiUsage(authed.client);
    if (!reservation.allowed) return quotaExceeded(reservation);

    let raw: string;
    try {
      raw = await generateText({
        system: 'You are an idea exploration assistant. Return only valid JSON and no markdown.',
        prompt: `Expand this idea: "${ideaTitle}"${ideaDescription ? ` - ${ideaDescription}` : ''}.\n\nRespond with this exact JSON shape:\n{ "questions": ["3 questions to explore deeper"], "angles": ["3 different perspectives"], "related": ["3 related concepts"] }`,
        maxTokens: 800,
      });
    } catch (err) {
      if (err instanceof GeminiRequestError) await refundAiUsage(authed.client);
      throw err;
    }

    let parsed: unknown;
    try { parsed = parseJsonObject(raw); } catch { return badGateway('Model returned invalid JSON'); }
    if (!isValid(parsed)) return badGateway();

    if (ideaId) {
      const { error: insertError } = await authed.client.from('idea_expansions').insert({
        idea_id: ideaId,
        questions: parsed.questions,
        angles: parsed.angles,
        related: parsed.related,
      });
      // Best-effort: history is supplementary, never blocks returning the
      // expansion result the user is waiting on. RLS also rejects an
      // ideaId that isn't the caller's, which lands here rather than failing
      // the request.
      if (insertError) console.error('idea_expansions insert failed', insertError);
    }

    return ok(parsed, reservation);
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiRequestError) return badGateway(e.message);
    return internalError();
  }
});
