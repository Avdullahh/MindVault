import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
export const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
