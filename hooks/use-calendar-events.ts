import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/get-user-id';
import { emitDataChange, subscribeToDataChanges } from '../lib/data-events';
import { parseCalendarStoredDate, toLocalDateString } from '../lib/date-utils';
import type { CalendarEvent, CalendarEventInsert } from '../types';

export function useCalendarEvents() {
  const source = useRef(Symbol('calendar_events'));
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
    else {
      setError(null);
      setEvents(data ?? []);
    }
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
    emitDataChange('calendar_events', source.current);
    return null;
  };

  const update = async (
    id: string,
    payload: Partial<Pick<CalendarEvent, 'title' | 'start_at' | 'end_at' | 'all_day' | 'notes' | 'done' | 'category_id'>>,
  ): Promise<string | null> => {
    const { error: err } = await supabase.from('calendar_events').update(payload).eq('id', id);
    if (err) return err.message;
    await fetch();
    emitDataChange(['calendar_events', 'tasks'], source.current);
    return null;
  };

  const toggleDone = async (id: string): Promise<string | null> => {
    const event = events.find((e) => e.id === id);
    if (!event) return 'Event not found';
    const next = !event.done;
    const { error: err } = await supabase.from('calendar_events').update({ done: next }).eq('id', id);
    if (err) return err.message;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, done: next } : e)));
    emitDataChange('calendar_events', source.current);
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('calendar_events').delete().eq('id', id);
    if (err) return err.message;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    emitDataChange(['calendar_events', 'tasks'], source.current);
    return null;
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const key = toLocalDateString(parseCalendarStoredDate(ev.start_at));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        if (a.all_day && !b.all_day) return -1;
        if (!a.all_day && b.all_day) return 1;
        return a.start_at.localeCompare(b.start_at);
      });
    }
    return map;
  }, [events]);

  useEffect(() => {
    fetch();
    return subscribeToDataChanges('calendar_events', (eventSource) => {
      if (eventSource !== source.current) fetch();
    });
  }, []);

  return { events, eventsByDate, loading, error, refetch: fetch, create, update, toggleDone, remove };
}
