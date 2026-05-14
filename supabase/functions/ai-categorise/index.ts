import { GeminiRequestError, generateText } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { badGateway, badRequest, corsPreflight, internalError, ok, paymentRequired, unauthorised } from '../_shared/responses.ts';

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

    const { data: cats, error: categoryError } = await authed.client.from('categories').select('name').order('name');
    if (categoryError) {
      console.error('Failed to load categories', categoryError);
      return internalError('Failed to load categories');
    }

    const categoryNames = (cats ?? []).map((c: { name: string }) => c.name);
    if (categoryNames.length === 0) return ok({ categoryName: 'Other' });

    const raw = await generateText({
      system: 'You are a categorisation assistant. Reply with only one category name from the supplied list, nothing else.',
      prompt: `Categories: ${categoryNames.join(', ')}\n\nIdea: "${ideaTitle.trim()}"${ideaDescription ? `\n${ideaDescription.trim()}` : ''}\n\nWhich single category best fits?`,
      maxTokens: 80,
      temperature: 0,
    });
    const match = categoryNames.find((n: string) => n.toLowerCase() === raw.toLowerCase()) ?? 'Other';
    return ok({ categoryName: match });
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiRequestError) return badGateway(e.message);
    return internalError();
  }
});
