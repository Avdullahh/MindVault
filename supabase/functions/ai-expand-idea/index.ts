import Anthropic from 'npm:@anthropic-ai/sdk';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { ok, unauthorised, badRequest, internalError, badGateway, corsPrelight } from '../_shared/responses.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

type ExpandResult = { questions: string[]; angles: string[]; related: string[] };

function isValid(v: unknown): v is ExpandResult {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  const isStringArray = (a: unknown) => Array.isArray(a) && (a as unknown[]).every((x) => typeof x === 'string');
  return isStringArray(o.questions) && isStringArray(o.angles) && isStringArray(o.related);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPrelight();

  const authed = await getAuthedClient(req);
  if (!authed) return unauthorised();
  if (!await checkProEntitlement(authed.userId)) return unauthorised();

  let body: { ideaTitle?: string; ideaDescription?: string };
  try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

  const { ideaTitle, ideaDescription } = body;
  if (!ideaTitle?.trim()) return badRequest('ideaTitle is required');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are an idea exploration assistant. Always respond with valid JSON only, no markdown, no prose.',
      messages: [{
        role: 'user',
        content: `Expand this idea: "${ideaTitle}"${ideaDescription ? ` — ${ideaDescription}` : ''}.\n\nRespond with JSON:\n{ "questions": ["3 questions to explore deeper"], "angles": ["3 different perspectives"], "related": ["3 related concepts"] }`,
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
