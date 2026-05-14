import { genAI } from '../_shared/gemini.ts';
import { getAuthedClient } from '../_shared/auth.ts';
import { checkProEntitlement } from '../_shared/entitlement.ts';
import { ok, unauthorised, badRequest, internalError, corsPrelight } from '../_shared/responses.ts';

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are a categorisation assistant. Reply with only the category name, nothing else.',
    });
    const result = await model.generateContent(
      `Categories: ${categoryNames.join(', ')}\n\nIdea: "${ideaTitle}"${ideaDescription ? `\n${ideaDescription}` : ''}\n\nWhich single category best fits? Reply with the category name only.`,
    );
    const raw = result.response.text().trim();
    const match = categoryNames.find((n: string) => n.toLowerCase() === raw.toLowerCase()) ?? 'Other';
    return ok({ categoryName: match });
  } catch {
    return internalError();
  }
});
