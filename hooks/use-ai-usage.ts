import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type UsageSnapshot = { allowed: boolean; remaining: number; resetAt: string | null };

// Mirrors the constant baked into check_ai_usage()/reserve_ai_usage()
// (supabase/migrations/20260910000000_create_ai_usage.sql). Display-only —
// the server owns the real limit.
export const AI_USAGE_LIMIT = 10;

export const aiUsageQueryKey = ['ai-usage'];

async function fetchUsage(): Promise<UsageSnapshot> {
  const { data, error } = await supabase.rpc('check_ai_usage');
  if (error) throw new Error(error.message);
  return (data as UsageSnapshot | null) ?? { allowed: true, remaining: AI_USAGE_LIMIT, resetAt: null };
}

/**
 * Derives the *displayed* usage state from a possibly-stale cached snapshot:
 * once `resetAt` has passed, the window has rolled over even if nothing has
 * refetched yet, so report full quota rather than a stuck "0 remaining".
 */
function deriveDisplayUsage(usage: UsageSnapshot | undefined): UsageSnapshot | null {
  if (!usage) return null;
  if (usage.resetAt && new Date(usage.resetAt).getTime() <= Date.now()) {
    return { allowed: true, remaining: AI_USAGE_LIMIT, resetAt: null };
  }
  return usage;
}

/** Formats a future timestamp as "Xh Ym" (or just "Ym" under an hour), rounded up so it never reads "0m" while time remains. */
function formatCountdown(resetAt: string): string {
  const totalMinutes = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Renders nothing when quota is comfortable (no phantom UI) — only shown
 * near an AI action button once remaining is low, or once exhausted.
 */
export function getUsageHint(usage: UsageSnapshot | null): string | null {
  if (!usage || usage.remaining > 3) return null;
  const countdown = usage.resetAt ? formatCountdown(usage.resetAt) : null;
  if (usage.remaining <= 0) {
    return countdown ? `AI limit reached — resets in ${countdown}` : 'AI limit reached';
  }
  const left = `${usage.remaining} AI use${usage.remaining === 1 ? '' : 's'} left`;
  return countdown ? `${left} · resets in ${countdown}` : left;
}

export function useAiUsage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: aiUsageQueryKey, queryFn: fetchUsage, refetchOnMount: true });
  const usage = deriveDisplayUsage(query.data);

  return {
    usage,
    hint: getUsageHint(usage),
    loading: query.isLoading,
    /** Push a fresher snapshot (e.g. returned alongside a successful AI call) into the shared cache without a round-trip. */
    setUsage: (next: UsageSnapshot) => queryClient.setQueryData(aiUsageQueryKey, next),
  };
}
