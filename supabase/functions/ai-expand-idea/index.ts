import { GeminiRequestError, generateText, parseJsonObject } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

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

    let body: { ideaTitle?: string; ideaDescription?: string };
    try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

    const { ideaTitle, ideaDescription } = body;
    if (!ideaTitle?.trim()) return badRequest('ideaTitle is required');

    const raw = await generateText({
      system: 'You are an idea exploration assistant. Return only valid JSON and no markdown.',
      prompt: `Expand this idea: "${ideaTitle.trim()}"${ideaDescription ? ` - ${ideaDescription.trim()}` : ''}.\n\nRespond with this exact JSON shape:\n{ "questions": ["3 questions to explore deeper"], "angles": ["3 different perspectives"], "related": ["3 related concepts"] }`,
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
