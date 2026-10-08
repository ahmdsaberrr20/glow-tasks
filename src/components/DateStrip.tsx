import { useEffect, useMemo, useRef } from 'react';
import { useData } from '../data';
import { fromKey, keysBetween, shiftKey, WEEKDAY_SHORT, type DayKey } from '../lib/dates';
import { dayProgress } from '../lib/stats';

const RANGE = 21;

export function DateStrip({ selected, onSelect }: { selected: DayKey; onSelect: (k: DayKey) => void }) {
  const { tasks, done, today } = useData();
  const ref = useRef<HTMLDivElement>(null);

  // Centre the strip on whichever is further out: today or the selected day.
  const anchor = Math.abs(fromKey(selected).getTime() - fromKey(today).getTime()) > RANGE * 864e5 / 2 ? selected : today;
  const days = useMemo(() => keysBetween(shiftKey(anchor, -RANGE), shiftKey(anchor, RANGE)), [anchor]);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selected, anchor]);

  return (
    <div className="datestrip" ref={ref}>
      {days.map((k) => {
        const p = dayProgress(tasks, done, k);
        const dot = p.total === 0 ? '' : p.done === p.total ? 'full' : p.done > 0 ? 'partial' : '';
        const d = fromKey(k);
        return (
          <button
            key={k}
            data-day={k}
            className={`day-chip ${k === selected ? 'selected' : ''} ${k === today ? 'today' : ''}`}
            onClick={() => onSelect(k)}
          >
            <span className="dw">{k === today ? 'Today' : WEEKDAY_SHORT[d.getDay()]}</span>
            <span className="dn">{d.getDate()}</span>
            <span className={`day-dot ${dot}`} style={{ visibility: p.total ? 'visible' : 'hidden' }} />
          </button>
        );
      })}
    </div>
  );
}
