import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Category, type Task } from './db';
import { doneSet, type DoneSet } from './lib/stats';
import { todayKey, type DayKey } from './lib/dates';

export interface Settings {
  theme: string;
  weekStart: number;
}

const DEFAULT_SETTINGS: Settings = { theme: 'aurora', weekStart: 1 };

interface AppData {
  categories: Category[];
  catMap: Map<string, Category>;
  tasks: Task[];
  done: DoneSet;
  settings: Settings;
  today: DayKey;
}

const Ctx = createContext<AppData | null>(null);

/** Re-renders when the calendar day changes (app left open overnight, or resumed). */
function useToday() {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const check = () => setToday(todayKey());
    const id = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.orderBy('order').toArray(), []);
  const completions = useLiveQuery(() => db.completions.toArray(), []);
  const rawSettings = useLiveQuery(() => db.settings.toArray(), []);
  const today = useToday();

  const value = useMemo<AppData | null>(() => {
    if (!categories || !tasks || !completions || !rawSettings) return null;
    const settings = { ...DEFAULT_SETTINGS } as Settings;
    for (const s of rawSettings) (settings as unknown as Record<string, unknown>)[s.key] = s.value;
    return {
      categories,
      catMap: new Map(categories.map((c) => [c.id, c])),
      tasks,
      done: doneSet(completions),
      settings,
      today,
    };
  }, [categories, tasks, completions, rawSettings, today]);

  useEffect(() => {
    if (value) document.documentElement.dataset.theme = value.settings.theme;
  }, [value?.settings.theme]);

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData outside DataProvider');
  return v;
}

export const FALLBACK_COLOR = '#8E8E93';
