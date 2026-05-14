const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export class GeminiRequestError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

export async function generateText({
  system,
  prompt,
  maxTokens = 800,
  temperature = 0.2,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new GeminiRequestError('GEMINI_API_KEY is not configured');

  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    });
  } catch (err) {
    console.error('Gemini fetch failed (network error)', err);
    throw new GeminiRequestError('AI provider unreachable');
  }

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error('Gemini request failed', response.status, details);
    throw new GeminiRequestError(`Gemini ${response.status}: ${details.slice(0, 300)}`, response.status);
  }

  const payload = await response.json();
  const text: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  const trimmed = text?.trim();
  if (!trimmed) throw new GeminiRequestError('AI provider returned no text');
  return trimmed;
}

export function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}
