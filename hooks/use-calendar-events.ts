import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import type { CalendarEvent, CalendarEventInsert } from '../types';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_at', { ascending: true });
    if (err) setError(err.message);
    else setEvents(data ?? []);
    setLoading(false);
  };

  const create = async (
    payload: Pick<CalendarEventInsert, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'category_id'>,
  ): Promise<string | null> => {
    const user_id = await getUserId().catch(() => null);
    if (!user_id) return 'Not authenticated';
    const { error: err } = await supabase.from('calendar_events').insert({ ...payload, user_id });
    if (err) return err.message;
    await fetch();
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<CalendarEvent, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('calendar_events').update(payload).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('calendar_events').delete().eq('id', id);
    if (err) return err.message;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    return null;
  };

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const key = ev.start_at.slice(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  }

  useEffect(() => { fetch(); }, []);

  return { events, eventsByDate, loading, error, refetch: fetch, create, update, remove };
}
