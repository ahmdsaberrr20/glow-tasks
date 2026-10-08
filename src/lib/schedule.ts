import type { Task } from '../db';
import { weekdayOf, type DayKey } from './dates';

/** The single rule deciding whether a task appears on a given day. */
export function isScheduled(task: Task, day: DayKey): boolean {
  if (task.kind === 'once') return task.date === day;
  if (day < task.createdAt) return false;
  if (task.archivedAt && day >= task.archivedAt) return false;
  if (task.kind === 'habit') return true;
  return (task.weekdays ?? []).includes(weekdayOf(day));
}

export function tasksForDate(tasks: Task[], day: DayKey): Task[] {
  return tasks.filter((t) => isScheduled(t, day)).sort((a, b) => a.order - b.order);
}

export function describeSchedule(task: Task): string {
  if (task.kind === 'habit') return 'Every day';
  if (task.kind === 'once') return task.date ?? '';
  const days = [...(task.weekdays ?? [])].sort();
  if (days.length === 7) return 'Every day';
  if (days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.join() === '0,6') return 'Weekends';
  return days.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(' · ');
}
