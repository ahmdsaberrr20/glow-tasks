import { db } from '../db';
import { todayKey } from './dates';

const TABLES = ['categories', 'tasks', 'completions', 'settings'] as const;

export async function exportBackup() {
  const data: Record<string, unknown> = { app: 'glow', version: 1, exportedAt: new Date().toISOString() };
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  const json = JSON.stringify(data, null, 2);
  const name = `glow-backup-${todayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });

  // In an installed iOS PWA, the share sheet ("Save to Files") is the reliable path.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text());
  if (data?.app !== 'glow' || !TABLES.every((t) => Array.isArray(data[t]))) {
    throw new Error('This file is not a Glow backup.');
  }
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      await db.table(t).bulkPut(data[t]);
    }
  });
}

export async function resetAll() {
  await db.delete();
  location.reload();
}
