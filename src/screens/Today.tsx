import { AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toggleCompletion, type Task } from '../db';
import { useData } from '../data';
import { DateStrip } from '../components/DateStrip';
import { ProgressRing } from '../components/ProgressRing';
import { TaskItem } from '../components/TaskItem';
import { TaskSheet } from '../components/TaskSheet';
import { Confetti } from '../components/Confetti';
import { IconPlus } from '../components/Icons';
import { fromKey, shiftKey, type DayKey } from '../lib/dates';
import { tasksForDate } from '../lib/schedule';
import { dayProgress, isDone, ratio, streak } from '../lib/stats';

interface Props {
  day: DayKey;
  setDay: (k: DayKey) => void;
}

function greeting(day: DayKey, today: DayKey) {
  if (day === today) {
    const h = new Date().getHours();
    return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }
  if (day === shiftKey(today, -1)) return 'Yesterday';
  if (day === shiftKey(today, 1)) return 'Tomorrow';
  return format(fromKey(day), 'EEEE');
}

function message(done: number, total: number) {
  if (total === 0) return 'Nothing planned. Tap + to add something.';
  if (done === total) return 'All done. Beautiful work ✨';
  const left = total - done;
  if (done === 0) return `${total} thing${total > 1 ? 's' : ''} to do. You’ve got this.`;
  return `${left} to go — keep the momentum.`;
}

export function Today({ day, setDay }: Props) {
  const { tasks, catMap, done, today } = useData();
  const [editing, setEditing] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [burst, setBurst] = useState(0);

  const list = useMemo(() => tasksForDate(tasks, day), [tasks, day]);
  const progress = dayProgress(tasks, done, day);

  const groups = [
    { key: 'habit', label: 'Daily habits', items: list.filter((t) => t.kind === 'habit') },
    { key: 'weekly', label: `Every ${format(fromKey(day), 'EEEE')}`, items: list.filter((t) => t.kind === 'weekly') },
    { key: 'once', label: 'Just this day', items: list.filter((t) => t.kind === 'once') },
  ].filter((g) => g.items.length);

  // Celebrate when the viewed day flips to fully complete through a tap.
  const complete = progress.total > 0 && progress.done === progress.total;
  const prev = useRef({ day, complete, tapped: false });
  useEffect(() => {
    const p = prev.current;
    if (p.tapped && p.day === day && !p.complete && complete) {
      setBurst((b) => b + 1);
      navigator.vibrate?.([20, 40, 20]);
    }
    prev.current = { day, complete, tapped: false };
  }, [day, complete]);

  const toggle = (t: Task) => {
    prev.current.tapped = true;
    toggleCompletion(t.id, day);
  };

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="hero">
        <div className="hero-text">
          <div className="hero-date">{format(fromKey(day), 'EEEE, MMMM d')}</div>
          <div className="hero-title">{greeting(day, today)}</div>
          <div className="hero-msg">{message(progress.done, progress.total)}</div>
        </div>
        <ProgressRing value={ratio(progress)}>
          <div className="ring-label">
            <b className={progress.total && progress.done === progress.total ? 'grad-text' : ''}>
              {Math.round(ratio(progress) * 100)}%
            </b>
            <small>
              {progress.done}/{progress.total}
            </small>
          </div>
        </ProgressRing>
      </div>

      <DateStrip selected={day} onSelect={setDay} />

      {day !== today && (
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <button className="btn small" onClick={() => setDay(today)}>
            Jump to today
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">
          <div className="big">🌙</div>
          <b>A clear day</b>
          Add a habit, a weekly routine, or a one-off task.
          <div style={{ marginTop: 18 }}>
            <button className="btn primary" onClick={openNew}>
              <IconPlus width={18} height={18} /> Add a task
            </button>
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key}>
            <div className="section-label">
              <span>{g.label}</span>
              <span>
                {g.items.filter((t) => isDone(done, t.id, day)).length}/{g.items.length}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {g.items.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  category={t.categoryId ? catMap.get(t.categoryId) : undefined}
                  done={isDone(done, t.id, day)}
                  streak={t.kind !== 'once' && day === today ? streak(t, done, today).current : undefined}
                  onToggle={() => toggle(t)}
                  onEdit={() => {
                    setEditing(t);
                    setSheetOpen(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </section>
        ))
      )}

      <button className="fab" aria-label="Add task" onClick={openNew}>
        <IconPlus />
      </button>

      <TaskSheet open={sheetOpen} task={editing} day={day} onClose={() => setSheetOpen(false)} />
      <Confetti burst={burst} />
    </>
  );
}
