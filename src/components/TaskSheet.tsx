import { useEffect, useState } from 'react';
import { removeTask, saveTask, type Task, type TaskKind } from '../db';
import { useData } from '../data';
import { WEEKDAY_LETTER, weekdayOf, type DayKey } from '../lib/dates';
import { CategorySheet } from './CategorySheet';
import { Segmented } from './Segmented';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  task?: Task | null;
  /** Day the sheet was opened from — used as the default date / weekday. */
  day: DayKey;
  onClose: () => void;
}

const KINDS: { value: TaskKind; label: string }[] = [
  { value: 'habit', label: 'Daily habit' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'once', label: 'One-off' },
];

const KIND_HINT: Record<TaskKind, string> = {
  habit: 'Shows up every day. Builds a streak.',
  weekly: 'Repeats on the days you pick, every week.',
  once: 'Happens on one date only.',
};

export function TaskSheet({ open, task, day, onClose }: Props) {
  const { categories, settings, today } = useData();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>('habit');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [date, setDate] = useState(day);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [catSheet, setCatSheet] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setKind(task?.kind ?? 'habit');
    setWeekdays(task?.weekdays ?? [weekdayOf(day)]);
    setDate(task?.date ?? day);
    setCategoryId(task?.categoryId);
    setNotes(task?.notes ?? '');
  }, [open, task, day]);

  const valid = title.trim() && (kind !== 'weekly' || weekdays.length > 0) && (kind !== 'once' || date);

  const save = async () => {
    if (!valid) return;
    await saveTask({
      id: task?.id,
      title: title.trim(),
      kind,
      weekdays: kind === 'weekly' ? [...weekdays].sort() : undefined,
      date: kind === 'once' ? date : undefined,
      categoryId,
      notes: notes.trim() || undefined,
      // Adding from a past day starts the task on that day so it can be ticked there.
      createdAt: task ? undefined : day < today ? day : today,
    });
    onClose();
  };

  const toggleDay = (d: number) =>
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d]));

  const order = Array.from({ length: 7 }, (_, i) => (i + settings.weekStart) % 7);

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <h2>{task ? 'Edit task' : 'New task'}</h2>

        <div className="field">
          <input
            className="input"
            placeholder="What do you want to do?"
            value={title}
            autoFocus={!task}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </div>

        <div className="field">
          <Segmented value={kind} options={KINDS} onChange={setKind} />
          <p className="note" style={{ margin: '8px 2px 0' }}>{KIND_HINT[kind]}</p>
        </div>

        {kind === 'weekly' && (
          <div className="field">
            <label>Repeat on</label>
            <div className="weekday-pills">
              {order.map((d) => (
                <button key={d} type="button" className={weekdays.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>
                  {WEEKDAY_LETTER[d]}
                </button>
              ))}
            </div>
            <div className="quick-days">
              <button type="button" onClick={() => setWeekdays([1, 2, 3, 4, 5])}>Weekdays</button>
              <button type="button" onClick={() => setWeekdays([0, 6])}>Weekends</button>
              <button type="button" onClick={() => setWeekdays([1, 3, 5])}>M · W · F</button>
            </div>
          </div>
        )}

        {kind === 'once' && (
          <div className="field">
            <label>Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label>Category</label>
          <div className="cat-picker">
            <button
              type="button"
              className={`cat-option ${!categoryId ? 'on' : ''}`}
              style={{ ['--cat' as string]: '#8E8E93' }}
              onClick={() => setCategoryId(undefined)}
            >
              None
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cat-option ${categoryId === c.id ? 'on' : ''}`}
                style={{ ['--cat' as string]: c.color }}
                onClick={() => setCategoryId(c.id)}
              >
                <span className="dot" />
                {c.name}
              </button>
            ))}
            <button type="button" className="cat-option add" onClick={() => setCatSheet(true)}>
              + New
            </button>
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea className="input" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="sheet-actions">
          {task && (
            <button
              className="btn danger"
              onClick={async () => {
                const msg =
                  task.kind === 'once'
                    ? 'Delete this task?'
                    : 'Remove this task from today onward? Your past progress is kept.';
                if (confirm(msg)) {
                  await removeTask(task);
                  onClose();
                }
              }}
            >
              {task.kind === 'once' ? 'Delete' : 'Remove'}
            </button>
          )}
          <button className="btn primary" disabled={!valid} onClick={save}>
            {task ? 'Save' : 'Add task'}
          </button>
        </div>
      </Sheet>

      <CategorySheet open={catSheet} onClose={() => setCatSheet(false)} onSaved={setCategoryId} />
    </>
  );
}
