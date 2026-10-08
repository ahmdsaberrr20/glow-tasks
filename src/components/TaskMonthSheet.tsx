import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { toggleCompletion, type Task } from '../db';
import { FALLBACK_COLOR, useData } from '../data';
import { fromKey, keysBetween, toKey, WEEKDAY_LETTER, type DayKey } from '../lib/dates';
import { describeSchedule } from '../lib/schedule';
import { dayStatus, periodSummary, ratio, streak } from '../lib/stats';
import { IconCheck, IconLeft, IconRight } from './Icons';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  task?: Task;
  onClose: () => void;
}

const monthOf = (k: DayKey) => toKey(startOfMonth(fromKey(k)));

/** Day-by-day calendar for one recurring task, a month at a time. Tap a past day to fix it. */
export function TaskMonthSheet({ open, task, onClose }: Props) {
  const { done, today, catMap, settings } = useData();
  const [month, setMonth] = useState(() => monthOf(today));

  useEffect(() => {
    if (open) setMonth(monthOf(today));
  }, [open, today]);

  const days = useMemo(() => keysBetween(month, toKey(endOfMonth(fromKey(month)))), [month]);

  if (!task) return null;

  const category = task.categoryId ? catMap.get(task.categoryId) : undefined;
  const color = category?.color ?? FALLBACK_COLOR;
  const s = streak(task, done, today);
  const sum = periodSummary(task, done, days, today);
  const lead = (fromKey(month).getDay() - settings.weekStart + 7) % 7;
  const order = Array.from({ length: 7 }, (_, i) => (i + settings.weekStart) % 7);
  const minMonth = monthOf(task.createdAt);
  const maxMonth = monthOf(today);

  const shift = (n: number) => setMonth(toKey(addMonths(fromKey(month), n)));

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ ['--cat' as string]: color } as CSSProperties}>
        <div className="row" style={{ gap: 12, marginBottom: 4 }}>
          <span className="color-dot" style={{ width: 14, height: 14, boxShadow: `0 0 12px ${color}88` }} />
          <h2 style={{ margin: 0, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{task.title}</h2>
        </div>
        <p className="note" style={{ margin: '0 0 16px 26px' }}>
          {describeSchedule(task)}
          {category ? ` · ${category.name}` : ''}
        </p>

        <div className="stat-grid">
          <div className="stat">
            <b className={s.current ? 'grad-text' : ''}>{s.current ? `🔥${s.current}` : 0}</b>
            <span>Current streak</span>
          </div>
          <div className="stat">
            <b>{s.best}</b>
            <span>Best streak</span>
          </div>
          <div className="stat">
            <b>{sum.total ? `${Math.round(ratio(sum) * 100)}%` : '—'}</b>
            <span>This month</span>
          </div>
        </div>

        <div className="card month-card">
          <div className="week-nav" style={{ marginBottom: 12 }}>
            <button className="icon-btn" onClick={() => shift(-1)} disabled={month <= minMonth} aria-label="Previous month">
              <IconLeft />
            </button>
            <div className="label">{format(fromKey(month), 'MMMM yyyy')}</div>
            <button className="icon-btn" onClick={() => shift(1)} disabled={month >= maxMonth} aria-label="Next month">
              <IconRight />
            </button>
          </div>

          <div className="month-grid">
            {order.map((d) => (
              <span key={`h${d}`} className="month-head">
                {WEEKDAY_LETTER[d]}
              </span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.map((k) => {
              const st = dayStatus(task, done, k, today);
              const tappable = st === 'done' || st === 'missed' || st === 'today';
              return (
                <button
                  key={k}
                  className={`month-day ${st}`}
                  disabled={!tappable}
                  aria-label={`${format(fromKey(k), 'MMM d')}: ${st}`}
                  onClick={() => {
                    navigator.vibrate?.(10);
                    toggleCompletion(task.id, k);
                  }}
                >
                  {st === 'done' ? <IconCheck width={14} height={14} /> : fromKey(k).getDate()}
                </button>
              );
            })}
          </div>

          <div className="month-summary">
            <span>
              <b>{sum.done}</b> done
            </span>
            <span>
              <b>{sum.missed}</b> missed
            </span>
            <span>
              <b>{sum.scheduled}</b> scheduled so far
            </span>
          </div>
          <div className="bar" style={{ marginBottom: 0 }}>
            <div style={{ width: `${ratio(sum) * 100}%`, background: 'var(--cat)' }} />
          </div>
        </div>

        <div className="month-legend">
          <span><i className="month-day done" /> Done</span>
          <span><i className="month-day missed" /> Missed</span>
          <span><i className="month-day upcoming" /> Upcoming</span>
          <span><i className="month-day off" /> Not scheduled</span>
        </div>
        <p className="note" style={{ textAlign: 'center', margin: '10px 0 0' }}>
          Tap a past day to mark it done or undo it.
        </p>
      </div>
    </Sheet>
  );
}
