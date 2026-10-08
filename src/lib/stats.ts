import type { Category, Completion, Task } from '../db';
import { keysBetween, shiftKey, type DayKey } from './dates';
import { isScheduled } from './schedule';

export type DoneSet = Set<string>;

export const doneSet = (completions: Completion[]): DoneSet =>
  new Set(completions.map((c) => `${c.taskId}|${c.date}`));

export const isDone = (done: DoneSet, taskId: string, day: DayKey) => done.has(`${taskId}|${day}`);

export interface DayProgress {
  day: DayKey;
  done: number;
  total: number;
}

export function dayProgress(tasks: Task[], done: DoneSet, day: DayKey): DayProgress {
  let total = 0;
  let d = 0;
  for (const t of tasks) {
    if (!isScheduled(t, day)) continue;
    total++;
    if (isDone(done, t.id, day)) d++;
  }
  return { day, done: d, total };
}

export const ratio = (p: { done: number; total: number }) => (p.total ? p.done / p.total : 0);

/** Progress for each of the `n` days ending on `end` (oldest first). */
export function rangeProgress(tasks: Task[], done: DoneSet, end: DayKey, n: number): DayProgress[] {
  return keysBetween(shiftKey(end, -(n - 1)), end).map((k) => dayProgress(tasks, done, k));
}

export function sumProgress(list: DayProgress[]) {
  return list.reduce((a, p) => ({ done: a.done + p.done, total: a.total + p.total }), { done: 0, total: 0 });
}

export interface Streak {
  current: number;
  best: number;
}

/**
 * Streaks count consecutive *scheduled* occurrences that were completed, so a
 * Mon/Thu task isn't broken by Tuesday. Today not being done yet doesn't break
 * the current streak.
 */
export function streak(task: Task, done: DoneSet, today: DayKey): Streak {
  if (task.kind === 'once') return { current: 0, best: 0 };
  const end = task.archivedAt && task.archivedAt <= today ? shiftKey(task.archivedAt, -1) : today;
  if (end < task.createdAt) return { current: 0, best: 0 };

  const occurrences = keysBetween(task.createdAt, end).filter((k) => isScheduled(task, k));
  let best = 0;
  let run = 0;
  for (const k of occurrences) {
    run = isDone(done, task.id, k) ? run + 1 : 0;
    best = Math.max(best, run);
  }

  let current = 0;
  for (let i = occurrences.length - 1; i >= 0; i--) {
    const k = occurrences[i];
    if (isDone(done, task.id, k)) current++;
    else if (k === today) continue;
    else break;
  }
  return { current, best };
}

export interface CategoryStat {
  id: string | undefined;
  name: string;
  color: string;
  done: number;
  total: number;
}

export function categoryStats(
  tasks: Task[],
  categories: Category[],
  done: DoneSet,
  days: DayKey[],
): CategoryStat[] {
  const map = new Map<string | undefined, CategoryStat>();
  for (const c of categories) map.set(c.id, { id: c.id, name: c.name, color: c.color, done: 0, total: 0 });
  for (const t of tasks) {
    const key = t.categoryId && map.has(t.categoryId) ? t.categoryId : undefined;
    if (!map.has(key)) map.set(key, { id: undefined, name: 'Uncategorized', color: '#8E8E93', done: 0, total: 0 });
    const stat = map.get(key)!;
    for (const k of days) {
      if (!isScheduled(t, k)) continue;
      stat.total++;
      if (isDone(done, t.id, k)) stat.done++;
    }
  }
  return [...map.values()].filter((s) => s.total > 0);
}

export type DayStatus = 'done' | 'missed' | 'today' | 'upcoming' | 'off' | 'inactive';

/** How a single day looks for one task in its monthly calendar. */
export function dayStatus(task: Task, done: DoneSet, day: DayKey, today: DayKey): DayStatus {
  const active = day >= task.createdAt && !(task.archivedAt && day >= task.archivedAt);
  if (task.kind !== 'once' && !active) return 'inactive';
  if (isDone(done, task.id, day)) return 'done';
  if (!isScheduled(task, day)) return 'off';
  if (day > today) return 'upcoming';
  if (day === today) return 'today';
  return 'missed';
}

/** Totals over the given days, counting only scheduled days up to today. */
export function periodSummary(task: Task, done: DoneSet, days: DayKey[], today: DayKey) {
  let scheduled = 0;
  let completed = 0;
  for (const k of days) {
    if (k > today || !isScheduled(task, k)) continue;
    scheduled++;
    if (isDone(done, task.id, k)) completed++;
  }
  // Today isn't "missed" until it's over.
  const pendingToday = days.includes(today) && isScheduled(task, today) && !isDone(done, task.id, today) ? 1 : 0;
  return { scheduled, done: completed, missed: scheduled - completed - pendingToday, total: scheduled };
}
