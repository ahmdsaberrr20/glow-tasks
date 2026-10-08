import { describe, expect, it } from 'vitest';
import type { Category, Task } from '../db';
import { isScheduled, tasksForDate } from './schedule';
import { categoryStats, dayProgress, doneSet, streak } from './stats';
import { keysBetween, weekStartOf } from './dates';

// 2026-10-05 is a Monday.
const MON = '2026-10-05';
const TUE = '2026-10-06';
const WED = '2026-10-07';
const THU = '2026-10-08';

const task = (p: Partial<Task>): Task => ({
  id: p.id ?? 'x',
  title: 't',
  kind: 'habit',
  order: 0,
  createdAt: '2026-10-01',
  ...p,
});

const done = (pairs: [string, string][]) => doneSet(pairs.map(([taskId, date]) => ({ id: '', taskId, date })));

describe('isScheduled', () => {
  it('habit appears every day from createdAt', () => {
    const t = task({ createdAt: TUE });
    expect(isScheduled(t, MON)).toBe(false);
    expect(isScheduled(t, TUE)).toBe(true);
    expect(isScheduled(t, '2027-01-01')).toBe(true);
  });

  it('weekly only on chosen weekdays', () => {
    const t = task({ kind: 'weekly', weekdays: [1, 4] });
    expect([MON, TUE, WED, THU].map((d) => isScheduled(t, d))).toEqual([true, false, false, true]);
  });

  it('once only on its date, regardless of createdAt', () => {
    const t = task({ kind: 'once', date: WED, createdAt: THU });
    expect(isScheduled(t, WED)).toBe(true);
    expect(isScheduled(t, THU)).toBe(false);
  });

  it('archived tasks stop on archivedAt but keep history', () => {
    const t = task({ archivedAt: WED });
    expect(isScheduled(t, TUE)).toBe(true);
    expect(isScheduled(t, WED)).toBe(false);
  });

  it('tasksForDate sorts by order', () => {
    const list = tasksForDate([task({ id: 'b', order: 2 }), task({ id: 'a', order: 1 })], MON);
    expect(list.map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('dayProgress', () => {
  it('counts scheduled and done tasks', () => {
    const tasks = [task({ id: 'h' }), task({ id: 'w', kind: 'weekly', weekdays: [1] }), task({ id: 'o', kind: 'once', date: TUE })];
    const d = done([['h', MON], ['w', MON], ['o', TUE]]);
    expect(dayProgress(tasks, d, MON)).toEqual({ day: MON, done: 2, total: 2 });
    expect(dayProgress(tasks, d, TUE)).toEqual({ day: TUE, done: 1, total: 2 });
  });
});

describe('streak', () => {
  it('counts consecutive days and ignores today being unfinished', () => {
    const t = task({ id: 'h', createdAt: MON });
    expect(streak(t, done([['h', MON], ['h', TUE], ['h', WED]]), THU)).toEqual({ current: 3, best: 3 });
    expect(streak(t, done([['h', MON], ['h', TUE], ['h', WED], ['h', THU]]), THU)).toEqual({ current: 4, best: 4 });
  });

  it('breaks on a missed day but remembers best', () => {
    const t = task({ id: 'h', createdAt: '2026-10-01' });
    const d = done([['h', '2026-10-01'], ['h', '2026-10-02'], ['h', '2026-10-03'], ['h', WED]]);
    expect(streak(t, d, THU)).toEqual({ current: 1, best: 3 });
  });

  it('weekly streak only counts scheduled weekdays', () => {
    const t = task({ id: 'w', kind: 'weekly', weekdays: [1, 4], createdAt: '2026-09-28' });
    // Mon 9/28, Thu 10/1, Mon 10/5 done; Thu 10/8 is today and not done yet.
    const d = done([['w', '2026-09-28'], ['w', '2026-10-01'], ['w', MON]]);
    expect(streak(t, d, THU)).toEqual({ current: 3, best: 3 });
  });

  it('is zero for tasks created in the future', () => {
    expect(streak(task({ createdAt: '2027-01-01' }), done([]), THU)).toEqual({ current: 0, best: 0 });
  });
});

describe('categoryStats', () => {
  it('groups by category with an uncategorized bucket', () => {
    const cats: Category[] = [{ id: 'c1', name: 'Health', color: '#0f0', order: 0 }];
    const tasks = [task({ id: 'a', categoryId: 'c1' }), task({ id: 'b' })];
    const stats = categoryStats(tasks, cats, done([['a', MON]]), [MON, TUE]);
    expect(stats.map((s) => [s.name, s.done, s.total])).toEqual([
      ['Health', 1, 2],
      ['Uncategorized', 0, 2],
    ]);
  });
});

describe('dates', () => {
  it('weekStartOf respects the configured start day', () => {
    expect(weekStartOf(THU, 1)).toBe(MON);
    expect(weekStartOf(THU, 0)).toBe('2026-10-04');
    expect(weekStartOf(MON, 1)).toBe(MON);
  });

  it('keysBetween crosses month boundaries', () => {
    expect(keysBetween('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });
});
