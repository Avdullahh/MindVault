export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toLocalTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Calendar events are written as naive local strings (no tz suffix). Supabase returns
// them with a UTC offset appended, which would shift the time by the device's UTC offset.
// Strip the suffix so JS parses the value back as a local time, matching the original intent.
export function parseCalendarStoredDate(iso: string): Date {
  return new Date(iso.replace(/([+-]\d{2}:?\d{2}|[Zz])$/, ''));
}
