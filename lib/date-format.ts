const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-u-ca-gregory', opts);

const DATE_FMT        = fmt({ month: 'long',  day: 'numeric', year: 'numeric' });
const SHORT_DATE_FMT  = fmt({ month: 'short', day: 'numeric', year: 'numeric' });
const SHORT_MD_FMT    = fmt({ month: 'short', day: 'numeric' });
const WEEKDAY_FMT     = fmt({ weekday: 'long', month: 'long', day: 'numeric' });
const TIME_FMT        = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

export const formatDate          = (d: Date) => DATE_FMT.format(d);
export const formatShortDate     = (d: Date) => SHORT_DATE_FMT.format(d);
export const formatShortMonthDay = (d: Date) => SHORT_MD_FMT.format(d);
export const formatWeekdayLong   = (d: Date) => WEEKDAY_FMT.format(d);
export const formatTime          = (d: Date) => TIME_FMT.format(d);
