import { useState } from 'react';
import { supabase } from '../lib/supabase';

const BASE = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

export type AIStatus = 'idle' | 'loading' | 'success' | 'error';
type AIState<T> = { status: AIStatus; data: T | null; error: string | null };
type AIResult<T> = { data: T | null; error: string | null };

async function callEdgeFunction<T>(name: string, body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export type CategoriseResult = { categoryName: string };
export type ExpandResult = { questions: string[]; angles: string[]; related: string[] };
export type PlanResult = { title: string; deadline: string; priority: 'high' | 'medium' | 'low'; milestones: { title: string; steps: string[] }[]; tasks: string[] };
export type BriefResult = { greeting: string; events: string[]; resurface: { title: string; description: string } | null };

function makeState<T>(): AIState<T> {
  return { status: 'idle', data: null, error: null };
}

export function useAI() {
  const [categoriseState, setCategoriseState] = useState<AIState<CategoriseResult>>(makeState);
  const [expandState, setExpandState] = useState<AIState<ExpandResult>>(makeState);
  const [planState, setPlanState] = useState<AIState<PlanResult>>(makeState);
  const [briefState, setBriefState] = useState<AIState<BriefResult>>(makeState);

  function wrap<T>(
    setState: React.Dispatch<React.SetStateAction<AIState<T>>>,
    fn: () => Promise<T>,
  ) {
    return async (): Promise<AIResult<T>> => {
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
    };
  }

  const categorise = (ideaTitle: string, ideaDescription?: string) =>
    wrap(setCategoriseState, () =>
      callEdgeFunction<CategoriseResult>('ai-categorise', { ideaTitle, ideaDescription }),
    )();

  const expandIdea = (ideaTitle: string, ideaDescription?: string) =>
    wrap(setExpandState, () =>
      callEdgeFunction<ExpandResult>('ai-expand-idea', { ideaTitle, ideaDescription }),
    )();

  const planGoal = (goalTitle: string) =>
    wrap(setPlanState, () =>
      callEdgeFunction<PlanResult>('ai-plan-goal', { goalTitle }),
    )();

  const morningBrief = () =>
    wrap(setBriefState, () =>
      callEdgeFunction<BriefResult>('ai-morning-brief', {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    )();

  const resetExpand = () => setExpandState(makeState);

  return {
    categoriseState, categorise,
    expandState, expandIdea, resetExpand,
    planState, planGoal,
    briefState, morningBrief,
  };
}
