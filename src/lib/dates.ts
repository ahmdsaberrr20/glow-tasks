import { addDays, format, parseISO } from 'date-fns';

/** Day keys are local calendar dates as 'YYYY-MM-DD' strings — they sort lexically. */
export type DayKey = string;

export const toKey = (d: Date): DayKey => format(d, 'yyyy-MM-dd');
export const fromKey = (k: DayKey): Date => parseISO(k);
export const todayKey = (): DayKey => toKey(new Date());
export const shiftKey = (k: DayKey, n: number): DayKey => toKey(addDays(fromKey(k), n));
export const weekdayOf = (k: DayKey): number => fromKey(k).getDay();

/** Inclusive list of day keys from `start` to `end`. */
export function keysBetween(start: DayKey, end: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let k = start; k <= end; k = shiftKey(k, 1)) out.push(k);
  return out;
}

/** First day of the week containing `k`, given weekStart (0 = Sun, 1 = Mon). */
export function weekStartOf(k: DayKey, weekStart: number): DayKey {
  const diff = (weekdayOf(k) - weekStart + 7) % 7;
  return shiftKey(k, -diff);
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
