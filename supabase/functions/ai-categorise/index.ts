import Anthropic from 'npm:@anthropic-ai/sdk';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { ok, unauthorised, badRequest, internalError, corsPrelight } from '../_shared/responses.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPrelight();

  const authed = await getAuthedClient(req);
  if (!authed) return unauthorised();
  if (!await checkProEntitlement(authed.userId)) return unauthorised();

  let body: { ideaTitle?: string; ideaDescription?: string };
  try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

  const { ideaTitle, ideaDescription } = body;
  if (!ideaTitle?.trim()) return badRequest('ideaTitle is required');

  const { data: cats } = await authed.client.from('categories').select('name').order('name');
  const categoryNames = (cats ?? []).map((c: { name: string }) => c.name);
  if (categoryNames.length === 0) return ok({ categoryName: 'Other' });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      system: 'You are a categorisation assistant. Reply with only the category name, nothing else.',
      messages: [{
        role: 'user',
        content: `Categories: ${categoryNames.join(', ')}\n\nIdea: "${ideaTitle}"${ideaDescription ? `\n${ideaDescription}` : ''}\n\nWhich single category best fits? Reply with the category name only.`,
      }],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    const match = categoryNames.find((n: string) => n.toLowerCase() === raw.toLowerCase()) ?? 'Other';
    return ok({ categoryName: match });
  } catch {
    return internalError();
  }
});
