import Dexie, { type Table } from 'dexie';
import { todayKey, type DayKey } from './lib/dates';

export type TaskKind = 'habit' | 'weekly' | 'once';

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  categoryId?: string;
  kind: TaskKind;
  /** 0–6 (Sun–Sat), for 'weekly'. */
  weekdays?: number[];
  /** For 'once'. */
  date?: DayKey;
  notes?: string;
  order: number;
  /** First day the task is scheduled (recurring tasks). */
  createdAt: DayKey;
  /** First day the task is no longer scheduled (recurring tasks). */
  archivedAt?: DayKey;
}

export interface Completion {
  /** `${taskId}|${date}` — makes toggling a single get/put/delete. */
  id: string;
  taskId: string;
  date: DayKey;
}

export interface Setting {
  key: string;
  value: unknown;
}

class GlowDB extends Dexie {
  categories!: Table<Category, string>;
  tasks!: Table<Task, string>;
  completions!: Table<Completion, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('glow-daily-tasks');
    this.version(1).stores({
      categories: 'id, order',
      tasks: 'id, kind, date, order',
      completions: 'id, taskId, date',
      settings: 'key',
    });
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd([
        { id: uid(), name: 'Health', color: '#34D399', order: 0 },
        { id: uid(), name: 'Work', color: '#60A5FA', order: 1 },
        { id: uid(), name: 'Personal', color: '#F472B6', order: 2 },
      ]);
    });
  }
}

export const db = new GlowDB();

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const completionId = (taskId: string, date: DayKey) => `${taskId}|${date}`;

export async function toggleCompletion(taskId: string, date: DayKey): Promise<boolean> {
  const id = completionId(taskId, date);
  if (await db.completions.get(id)) {
    await db.completions.delete(id);
    return false;
  }
  await db.completions.put({ id, taskId, date });
  return true;
}

export async function saveTask(task: Omit<Task, 'id' | 'order' | 'createdAt'> & Partial<Task>) {
  if (task.id) {
    // Never touch createdAt/order on edit (Dexie removes keys set to undefined).
    const { id, createdAt: _c, order: _o, ...changes } = task;
    await db.tasks.update(id, changes);
    return id;
  }
  const id = uid();
  await db.tasks.add({ ...task, id, order: await db.tasks.count(), createdAt: task.createdAt ?? todayKey() } as Task);
  return id;
}

/** Recurring tasks are archived so past stats stay intact; one-off tasks are removed. */
export async function removeTask(task: Task) {
  if (task.kind === 'once') {
    await db.transaction('rw', db.tasks, db.completions, async () => {
      await db.tasks.delete(task.id);
      await db.completions.where('taskId').equals(task.id).delete();
    });
  } else {
    await db.tasks.update(task.id, { archivedAt: todayKey() });
  }
}

export async function restoreTask(task: Task) {
  await db.tasks.update(task.id, { archivedAt: undefined });
}

export async function deleteTaskForever(task: Task) {
  await db.transaction('rw', db.tasks, db.completions, async () => {
    await db.tasks.delete(task.id);
    await db.completions.where('taskId').equals(task.id).delete();
  });
}

export async function saveCategory(cat: Omit<Category, 'id' | 'order'> & Partial<Category>) {
  if (cat.id) {
    await db.categories.update(cat.id, cat);
    return cat.id;
  }
  const id = uid();
  await db.categories.add({ ...cat, id, order: await db.categories.count() } as Category);
  return id;
}

export async function deleteCategory(id: string) {
  await db.transaction('rw', db.categories, db.tasks, async () => {
    await db.categories.delete(id);
    await db.tasks.filter((t) => t.categoryId === id).modify({ categoryId: undefined });
  });
}

/** Swap `order` of two rows in a table to move an item up or down. */
export async function moveItem<T extends { id: string; order: number }>(
  table: Table<T, string>,
  list: T[],
  index: number,
  dir: -1 | 1,
) {
  const other = list[index + dir];
  const item = list[index];
  if (!other || !item) return;
  await db.transaction('rw', table, async () => {
    // Normalise orders first so swaps are always meaningful.
    await Promise.all(list.map((x, i) => table.update(x.id, { order: i } as never)));
    await table.update(item.id, { order: index + dir } as never);
    await table.update(other.id, { order: index } as never);
  });
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return ((await db.settings.get(key))?.value as T) ?? fallback;
}

export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value });
