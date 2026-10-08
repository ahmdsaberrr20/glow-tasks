import { useEffect, useRef, useState } from 'react';
import { db, deleteTaskForever, moveItem, restoreTask, setSetting, type Category, type Task, type TaskKind } from '../db';
import { useData, FALLBACK_COLOR } from '../data';
import { Segmented } from '../components/Segmented';
import { TaskSheet } from '../components/TaskSheet';
import { CategorySheet } from '../components/CategorySheet';
import { IconDown, IconUp, IconPlus } from '../components/Icons';
import { describeSchedule } from '../lib/schedule';
import { exportBackup, importBackup, resetAll } from '../lib/backup';
import { fromKey } from '../lib/dates';
import { format } from 'date-fns';

type Section = 'tasks' | 'categories' | 'settings';

const THEMES = [
  { id: 'aurora', name: 'Aurora', colors: ['#7C3AED', '#EC4899', '#F59E0B'] },
  { id: 'ocean', name: 'Ocean', colors: ['#14B8A6', '#3B82F6', '#8B5CF6'] },
  { id: 'neon', name: 'Neon', colors: ['#A3E635', '#22D3EE', '#3B82F6'] },
  { id: 'candy', name: 'Candy', colors: ['#F472B6', '#A78BFA', '#60A5FA'] },
  { id: 'ember', name: 'Ember', colors: ['#EF4444', '#F97316', '#FACC15'] },
];

const KIND_LABEL: Record<TaskKind, string> = { habit: 'Daily habits', weekly: 'Weekly', once: 'One-off' };

export function Manage({ onToast }: { onToast: (m: string) => void }) {
  const [section, setSection] = useState<Section>('tasks');
  return (
    <>
      <h1 className="screen-title">Manage</h1>
      <div style={{ margin: '12px 0 18px' }}>
        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { value: 'tasks', label: 'Tasks' },
            { value: 'categories', label: 'Categories' },
            { value: 'settings', label: 'Settings' },
          ]}
        />
      </div>
      {section === 'tasks' && <TasksSection />}
      {section === 'categories' && <CategoriesSection />}
      {section === 'settings' && <SettingsSection onToast={onToast} />}
    </>
  );
}

function Reorder({ onUp, onDown, first, last }: { onUp: () => void; onDown: () => void; first: boolean; last: boolean }) {
  return (
    <div className="reorder">
      <button disabled={first} onClick={onUp} aria-label="Move up">
        <IconUp />
      </button>
      <button disabled={last} onClick={onDown} aria-label="Move down">
        <IconDown />
      </button>
    </div>
  );
}

function TasksSection() {
  const { tasks, catMap, today } = useData();
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const active = tasks.filter((t) => !t.archivedAt && (t.kind !== 'once' || showPast || (t.date ?? '') >= today));
  const archived = tasks.filter((t) => t.archivedAt);
  const pastOnce = tasks.filter((t) => t.kind === 'once' && (t.date ?? '') < today).length;

  const edit = (t: Task | null) => {
    setEditing(t);
    setOpen(true);
  };

  return (
    <>
      <button className="btn primary block" onClick={() => edit(null)}>
        <IconPlus width={18} height={18} /> New task
      </button>

      {(['habit', 'weekly', 'once'] as TaskKind[]).map((kind) => {
        const list = active.filter((t) => t.kind === kind);
        if (kind === 'once') list.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
        return (
          <section key={kind}>
            <div className="section-label">
              <span>{KIND_LABEL[kind]}</span>
              {kind === 'once' && pastOnce > 0 && (
                <button style={{ textTransform: 'none', letterSpacing: 0 }} onClick={() => setShowPast((s) => !s)}>
                  {showPast ? 'Hide past' : `Show past (${pastOnce})`}
                </button>
              )}
            </div>
            {list.length === 0 && <p className="note" style={{ margin: '0 4px' }}>None yet.</p>}
            {list.map((t, i) => (
              <div className="list-item" key={t.id}>
                <span className="color-dot" style={{ ['--cat' as string]: (t.categoryId && catMap.get(t.categoryId)?.color) || FALLBACK_COLOR }} />
                <button className="main" onClick={() => edit(t)}>
                  <div className="t">{t.title}</div>
                  <div className="s">
                    {kind === 'once' ? format(fromKey(t.date!), 'EEE, MMM d yyyy') : describeSchedule(t)}
                    {t.categoryId && catMap.get(t.categoryId) ? ` · ${catMap.get(t.categoryId)!.name}` : ''}
                  </div>
                </button>
                {kind !== 'once' && (
                  <Reorder
                    first={i === 0}
                    last={i === list.length - 1}
                    onUp={() => moveItem(db.tasks, list, i, -1)}
                    onDown={() => moveItem(db.tasks, list, i, 1)}
                  />
                )}
              </div>
            ))}
          </section>
        );
      })}

      {archived.length > 0 && (
        <section>
          <div className="section-label">
            <span>Removed</span>
          </div>
          {archived.map((t) => (
            <div className="list-item" key={t.id} style={{ opacity: 0.7 }}>
              <div className="main">
                <div className="t">{t.title}</div>
                <div className="s">
                  {describeSchedule(t)} · removed {format(fromKey(t.archivedAt!), 'MMM d')}
                </div>
              </div>
              <button className="btn small" onClick={() => restoreTask(t)}>
                Restore
              </button>
              <button
                className="btn small danger"
                onClick={() => confirm(`Delete “${t.title}” and all its history?`) && deleteTaskForever(t)}
              >
                Delete
              </button>
            </div>
          ))}
        </section>
      )}

      <TaskSheet open={open} task={editing} day={today} onClose={() => setOpen(false)} />
    </>
  );
}

function CategoriesSection() {
  const { categories, tasks } = useData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  const edit = (c: Category | null) => {
    setEditing(c);
    setOpen(true);
  };

  return (
    <>
      <button className="btn primary block" onClick={() => edit(null)}>
        <IconPlus width={18} height={18} /> New category
      </button>
      <div style={{ marginTop: 16 }}>
        {categories.length === 0 && <p className="note">No categories yet.</p>}
        {categories.map((c, i) => {
          const count = tasks.filter((t) => t.categoryId === c.id && !t.archivedAt).length;
          return (
            <div className="list-item" key={c.id} style={{ ['--cat' as string]: c.color }}>
              <span className="color-dot" style={{ width: 22, height: 22, boxShadow: `0 0 14px ${c.color}66` }} />
              <button className="main" onClick={() => edit(c)}>
                <div className="t">{c.name}</div>
                <div className="s">
                  {count} task{count === 1 ? '' : 's'}
                </div>
              </button>
              <Reorder
                first={i === 0}
                last={i === categories.length - 1}
                onUp={() => moveItem(db.categories, categories, i, -1)}
                onDown={() => moveItem(db.categories, categories, i, 1)}
              />
            </div>
          );
        })}
      </div>
      <CategorySheet open={open} category={editing} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsSection({ onToast }: { onToast: (m: string) => void }) {
  const { settings } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  return (
    <>
      <div className="card">
        <h3 className="card-title">Theme</h3>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-opt ${settings.theme === t.id ? 'on' : ''}`} onClick={() => setSetting('theme', t.id)}>
              <div className="sw" style={{ background: `linear-gradient(120deg, ${t.colors[0]}, ${t.colors[1]} 55%, ${t.colors[2]})` }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Week starts on</h3>
        <Segmented
          value={String(settings.weekStart)}
          onChange={(v) => setSetting('weekStart', Number(v))}
          options={[
            { value: '1', label: 'Monday' },
            { value: '0', label: 'Sunday' },
            { value: '6', label: 'Saturday' },
          ]}
        />
      </div>

      <div className="card">
        <h3 className="card-title">Backup</h3>
        <p className="note" style={{ marginTop: 0 }}>
          Everything is stored only on this device. Export a backup now and then — if the app is removed from your Home
          Screen, its data goes with it.
          {persisted === true && ' Storage is marked persistent ✓'}
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => exportBackup().catch((e) => onToast(String(e.message ?? e)))}>
            Export
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (!confirm('Replace all current data with this backup?')) return;
              try {
                await importBackup(f);
                onToast('Backup restored ✓');
              } catch (err) {
                onToast((err as Error).message);
              }
            }}
          />
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Danger zone</h3>
        <button
          className="btn danger block"
          onClick={() => confirm('Erase all tasks, categories and progress? This cannot be undone.') && resetAll()}
        >
          Erase all data
        </button>
      </div>

      <p className="note" style={{ textAlign: 'center', marginTop: 24 }}>
        Glow · Add to Home Screen from Safari’s Share menu for the full app experience.
      </p>
    </>
  );
}
