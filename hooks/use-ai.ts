import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { emitDataChange } from '../lib/data-events';
import { supabase } from '../lib/supabase';
import { aiUsageQueryKey, type UsageSnapshot } from './use-ai-usage';

export type AIStatus = 'idle' | 'loading' | 'success' | 'error';
export type AIState<T> = {
  status: AIStatus;
  data: T | null;
  error: string | null;
  /** True when `error` is specifically a quota rejection (HTTP 429), not a generic failure — lets callers render distinct copy. */
  isQuotaExceeded: boolean;
  usage: UsageSnapshot | null;
};
export type AIResult<T> = { data: T | null; error: string | null };

/** Thrown by callEdgeFunction when the AI function responds 429 (quota exhausted). Discriminated on HTTP status, not message text. */
export class QuotaExceededError extends Error {
  constructor(message: string, public readonly usage: UsageSnapshot) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

type WithUsage<T> = T & { usage?: UsageSnapshot };

async function callEdgeFunction<T>(name: string, body: object): Promise<WithUsage<T>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke<WithUsage<T>>(name, { body });
  if (error) {
    const fnError = error as { message: string; context?: Response };
    let message = fnError.message;
    const context = fnError.context;
    if (context) {
      const payload = await context.clone().json().catch(() => null);
      if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
        message = payload.error;
      }
      if (context.status === 429 && payload && typeof payload === 'object' && 'usage' in payload) {
        throw new QuotaExceededError(message, payload.usage as UsageSnapshot);
      }
    }
    throw new Error(message);
  }
  if (!data) throw new Error('No response from AI function');
  return data;
}

export type ExpandResult = { questions: string[]; angles: string[]; related: string[] };
export type PlanResult = { tasks: string[] };
export type BriefMove = {
  targetType: 'idea' | 'goal' | 'project';
  targetId: string;
  title: string;
  reason: string;
  ctaLabel: string;
  logId: string | null;
};
export type BriefResult = { greeting: string; move: BriefMove | null };
export type ExpandInput = { ideaTitle: string; ideaDescription?: string; ideaId: string };
export type PlanGoalInput = { goalTitle: string; context?: string; projectId?: string };
export type MorningBriefInput = { timezone: string };

function makeState<T>(): AIState<T> {
  return { status: 'idle', data: null, error: null, isQuotaExceeded: false, usage: null };
}

export function useAI() {
  const [expandState, setExpandState] = useState<AIState<ExpandResult>>(makeState);
  const [planState, setPlanState] = useState<AIState<PlanResult>>(makeState);
  const [briefState, setBriefState] = useState<AIState<BriefResult>>(makeState);
  const source = useRef(Symbol('ai'));
  const queryClient = useQueryClient();

  async function run<T>(
    setState: React.Dispatch<React.SetStateAction<AIState<T>>>,
    fn: () => Promise<WithUsage<T>>,
  ): Promise<AIResult<T>> {
    setState({ status: 'loading', data: null, error: null, isQuotaExceeded: false, usage: null });
    try {
      const raw = await fn();
      const { usage, ...data } = raw as WithUsage<T> & Record<string, unknown>;
      if (usage) queryClient.setQueryData(aiUsageQueryKey, usage);
      setState({ status: 'success', data: data as T, error: null, isQuotaExceeded: false, usage: usage ?? null });
      return { data: data as T, error: null };
    } catch (e: unknown) {
      if (e instanceof QuotaExceededError) {
        queryClient.setQueryData(aiUsageQueryKey, e.usage);
        setState({ status: 'error', data: null, error: e.message, isQuotaExceeded: true, usage: e.usage });
        return { data: null, error: e.message };
      }
      const error = e instanceof Error ? e.message : 'Unknown error';
      setState({ status: 'error', data: null, error, isQuotaExceeded: false, usage: null });
      return { data: null, error };
    }
  }

  const expandIdea = async (ideaId: string, ideaTitle: string, ideaDescription?: string) => {
    const result = await run(setExpandState, () =>
      callEdgeFunction<ExpandResult>('ai-expand-idea', { ideaId, ideaTitle, ideaDescription } satisfies ExpandInput),
    );
    if (result.data) emitDataChange('idea-expansions', source.current);
    return result;
  };

  const planGoal = async (goalTitle: string, context?: string, projectId?: string) => {
    const result = await run(setPlanState, () =>
      callEdgeFunction<PlanResult>('ai-plan-goal', { goalTitle, context, projectId } satisfies PlanGoalInput),
    );
    if (result.data && projectId) emitDataChange('project-plans', source.current);
    return result;
  };

  const morningBrief = () =>
    run(setBriefState, () =>
      callEdgeFunction<BriefResult>('ai-morning-brief', {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } satisfies MorningBriefInput),
    );

  // Best-effort: records what the user did with a "Today's Move"
  // recommendation (tapped the CTA vs. dismissed it) against its
  // morning_brief_log row, so future briefs can avoid repeats and, later,
  // learn from taste. Not wired into React Query — nothing reads this
  // table client-side yet.
  const respondToBriefMove = async (logId: string, response: 'acted' | 'dismissed') => {
    const { error } = await supabase.from('morning_brief_log').update({ response }).eq('id', logId);
    if (error) console.error('Failed to record brief response', error);
  };

  const resetExpand = () => setExpandState(makeState);
  const resetBrief = () => setBriefState(makeState);
  const resetPlan = () => setPlanState(makeState);

  return {
    expandState, expandIdea, resetExpand,
    planState, planGoal, resetPlan,
    briefState, morningBrief, resetBrief, respondToBriefMove,
  };
}
