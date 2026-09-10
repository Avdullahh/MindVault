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

export type CategoriseResult = { categoryName: string };
export type ExpandResult = { questions: string[]; angles: string[]; related: string[] };
export type PlanResult = { tasks: string[] };
export type BriefResult = { greeting: string; resurface: { title: string; description: string } | null };
export type CategoriseInput = { ideaTitle: string; ideaDescription?: string };
export type ExpandInput = CategoriseInput & { ideaId: string };
export type PlanGoalInput = { goalTitle: string; context?: string };
export type MorningBriefInput = { timezone: string };

function makeState<T>(): AIState<T> {
  return { status: 'idle', data: null, error: null, isQuotaExceeded: false, usage: null };
}

export function useAI() {
  const [categoriseState, setCategoriseState] = useState<AIState<CategoriseResult>>(makeState);
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

  const categorise = (ideaTitle: string, ideaDescription?: string) =>
    run(setCategoriseState, () =>
      callEdgeFunction<CategoriseResult>('ai-categorise', { ideaTitle, ideaDescription } satisfies CategoriseInput),
    );

  const expandIdea = async (ideaId: string, ideaTitle: string, ideaDescription?: string) => {
    const result = await run(setExpandState, () =>
      callEdgeFunction<ExpandResult>('ai-expand-idea', { ideaId, ideaTitle, ideaDescription } satisfies ExpandInput),
    );
    if (result.data) emitDataChange('idea-expansions', source.current);
    return result;
  };

  const planGoal = (goalTitle: string, context?: string) =>
    run(setPlanState, () =>
      callEdgeFunction<PlanResult>('ai-plan-goal', { goalTitle, context } satisfies PlanGoalInput),
    );

  const morningBrief = () =>
    run(setBriefState, () =>
      callEdgeFunction<BriefResult>('ai-morning-brief', {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } satisfies MorningBriefInput),
    );

  const resetExpand = () => setExpandState(makeState);
  const resetBrief = () => setBriefState(makeState);
  const resetPlan = () => setPlanState(makeState);
  const resetCategorise = () => setCategoriseState(makeState);

  return {
    categoriseState, categorise, resetCategorise,
    expandState, expandIdea, resetExpand,
    planState, planGoal, resetPlan,
    briefState, morningBrief, resetBrief,
  };
}
