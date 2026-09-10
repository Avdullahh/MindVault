import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Client-side mirror of the limit/window baked into the reserve_ai_usage /
// check_ai_usage SQL functions (supabase/migrations/20260910000000_create_ai_usage.sql).
// For display/derivation only -- never sent to the RPCs, which own their own
// constants server-side so a client can't override them.
export const AI_USAGE_LIMIT = 10;
export const AI_USAGE_WINDOW_SECONDS = 24 * 60 * 60;

export type UsageSnapshot = { allowed: boolean; remaining: number; resetAt: string | null };

/**
 * Atomically reserves one unit of AI usage quota. Call immediately before a
 * Gemini call -- never earlier (a screen just checking state should call the
 * read-only check_ai_usage RPC instead) and never later (a check-then-call-
 * then-increment order isn't a hard cap under concurrency).
 *
 * Fails closed: if the RPC itself errors, treat the caller as not allowed
 * rather than silently letting an unmetered call through.
 */
export async function reserveAiUsage(client: SupabaseClient): Promise<UsageSnapshot> {
  const { data, error } = await client.rpc('reserve_ai_usage');
  if (error || !data) {
    console.error('reserve_ai_usage failed', error);
    return { allowed: false, remaining: 0, resetAt: null };
  }
  return data as UsageSnapshot;
}

/**
 * Best-effort refund of one unit, for when a Gemini call fails to complete
 * (network/timeout/HTTP error -- see GeminiRequestError in gemini.ts). Never
 * call this for a response that was received but rejected as invalid --
 * that still consumes quota by design (see the migration's comment on
 * refund_ai_usage for why).
 */
export async function refundAiUsage(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc('refund_ai_usage');
  if (error) console.error('refund_ai_usage failed', error);
}
