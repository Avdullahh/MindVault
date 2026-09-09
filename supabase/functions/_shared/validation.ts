// Caps on free-text fields injected into Gemini prompts. Keeps prompt cost
// bounded and closes the "arbitrarily long input" prompt-injection surface.
//
// These fields aren't always something a user just typed into a form field —
// e.g. ai-plan-goal receives a project's stored `main_goal`, which can
// already be longer than a UI would encourage. So we clamp (truncate)
// rather than reject: the property we need is "bounded text reaches
// Gemini", and truncation satisfies that without turning a stored value
// that predates this cap into a hard failure for the user.
export const MAX_TITLE_LENGTH = 300;
export const MAX_TEXT_LENGTH = 4000;

/** Truncates `value` (already trimmed) to `max` characters, if given. */
export function clamp(value: string | undefined, max: number): string | undefined {
  return value && value.length > max ? value.slice(0, max) : value;
}
