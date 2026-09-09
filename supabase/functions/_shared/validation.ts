// Caps on free-text fields injected into Gemini prompts. Keeps prompt cost
// bounded and closes the "arbitrarily long input" prompt-injection surface.
export const MAX_TITLE_LENGTH = 200;
export const MAX_TEXT_LENGTH = 2000;

/** Returns an error message if `value` (already trimmed) exceeds `max`, else null. */
export function lengthError(value: string | undefined, max: number, field: string): string | null {
  if (value && value.length > max) return `${field} must be ${max} characters or fewer`;
  return null;
}
