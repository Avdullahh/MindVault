import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type AIStatus = 'idle' | 'loading' | 'success' | 'error';
export type AIState<T> = { status: AIStatus; data: T | null; error: string | null };
export type AIResult<T> = { data: T | null; error: string | null };

async function callEdgeFunction<T>(name: string, body: object): Promise<T> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    const fnError = error as { message: string; context?: Response };
    let message = fnError.message;
    const context = fnError.context;
    if (context) {
      const payload = await context.clone().json().catch(() => null);
      if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
        message = payload.error;
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
export type BriefResult = { greeting: string; events: string[]; resurface: { title: string; description: string } | null };
export type CategoriseInput = { ideaTitle: string; ideaDescription?: string };
export type ExpandInput = CategoriseInput;
export type PlanGoalInput = { goalTitle: string; context?: string };
export type MorningBriefInput = { timezone: string };

function makeState<T>(): AIState<T> {
  return { status: 'idle', data: null, error: null };
}

export function useAI() {
  const [categoriseState, setCategoriseState] = useState<AIState<CategoriseResult>>(makeState);
  const [expandState, setExpandState] = useState<AIState<ExpandResult>>(makeState);
  const [planState, setPlanState] = useState<AIState<PlanResult>>(makeState);
  const [briefState, setBriefState] = useState<AIState<BriefResult>>(makeState);

  async function run<T>(
    setState: React.Dispatch<React.SetStateAction<AIState<T>>>,
    fn: () => Promise<T>,
  ): Promise<AIResult<T>> {
    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await fn();
      setState({ status: 'success', data, error: null });
      return { data, error: null };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      setState({ status: 'error', data: null, error });
      return { data: null, error };
    }
  }

  const categorise = (ideaTitle: string, ideaDescription?: string) =>
    run(setCategoriseState, () =>
      callEdgeFunction<CategoriseResult>('ai-categorise', { ideaTitle, ideaDescription } satisfies CategoriseInput),
    );

  const expandIdea = (ideaTitle: string, ideaDescription?: string) =>
    run(setExpandState, () =>
      callEdgeFunction<ExpandResult>('ai-expand-idea', { ideaTitle, ideaDescription } satisfies ExpandInput),
    );

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
