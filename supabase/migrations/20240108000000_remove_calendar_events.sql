-- Drop FK from tasks to calendar_events
ALTER TABLE tasks DROP COLUMN IF EXISTS calendar_event_id;

-- Drop calendar_events table (cascades RLS policies automatically)
DROP TABLE IF EXISTS calendar_events;
