import { format } from 'date-fns';
import { useState } from 'react';
import { useData, FALLBACK_COLOR } from '../data';
import { IconLeft, IconRight } from '../components/Icons';
import { fromKey, keysBetween, shiftKey, weekStartOf, type DayKey } from '../lib/dates';
import { tasksForDate } from '../lib/schedule';
import { dayProgress, isDone, ratio, sumProgress } from '../lib/stats';
import { ProgressRing } from '../components/ProgressRing';

export function Week({ onOpenDay }: { onOpenDay: (k: DayKey) => void }) {
  const { tasks, done, catMap, settings, today } = useData();
  const [start, setStart] = useState(() => weekStartOf(today, settings.weekStart));
  const days = keysBetween(start, shiftKey(start, 6));
  const progress = days.map((k) => dayProgress(tasks, done, k));
  const total = sumProgress(progress);
  const thisWeek = weekStartOf(today, settings.weekStart);

  return (
    <>
      <h1 className="screen-title">This week</h1>
      <p className="screen-sub">
        {format(fromKey(days[0]), 'MMM d')} – {format(fromKey(days[6]), 'MMM d')}
      </p>

      <div className="card row" style={{ gap: 16, marginBottom: 14 }}>
        <ProgressRing value={ratio(total)} size={72} stroke={8}>
          <div className="ring-label">
            <b style={{ fontSize: 17 }}>{Math.round(ratio(total) * 100)}%</b>
          </div>
        </ProgressRing>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>
            {total.done} of {total.total} done
          </div>
          <div className="note">
            {progress.filter((p) => p.total && p.done === p.total).length} perfect day
            {progress.filter((p) => p.total && p.done === p.total).length === 1 ? '' : 's'} this week
          </div>
        </div>
      </div>

      <div className="week-nav">
        <button className="icon-btn" onClick={() => setStart(shiftKey(start, -7))} aria-label="Previous week">
          <IconLeft />
        </button>
        <div className="label">
          {start === thisWeek ? (
            'This week'
          ) : (
            <button onClick={() => setStart(thisWeek)} className="grad-text" style={{ fontWeight: 700 }}>
              Back to this week
            </button>
          )}
        </div>
        <button className="icon-btn" onClick={() => setStart(shiftKey(start, 7))} aria-label="Next week">
          <IconRight />
        </button>
      </div>

      {days.map((k, i) => {
        const p = progress[i];
        const list = tasksForDate(tasks, k);
        return (
          <button key={k} className={`week-day ${k === today ? 'today' : ''}`} onClick={() => onOpenDay(k)}>
            <div className="week-day-head">
              <span className="name">{format(fromKey(k), 'EEEE')}</span>
              <span className="date">{format(fromKey(k), 'MMM d')}</span>
              <span className={`pct ${p.total && p.done === p.total ? 'grad-text' : ''}`}>
                {p.total ? `${Math.round(ratio(p) * 100)}%` : '—'}
              </span>
            </div>
            <div className="bar">
              <div style={{ width: `${ratio(p) * 100}%` }} />
            </div>
            {list.length > 0 ? (
              <div className="mini-tasks">
                {list.map((t) => (
                  <span
                    key={t.id}
                    className={`mini-task ${isDone(done, t.id, k) ? 'done' : ''}`}
                    style={{ ['--cat' as string]: (t.categoryId && catMap.get(t.categoryId)?.color) || FALLBACK_COLOR }}
                  >
                    {t.title}
                  </span>
                ))}
              </div>
            ) : (
              <div className="note">Nothing planned</div>
            )}
          </button>
        );
      })}
    </>
  );
}
