import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useData, FALLBACK_COLOR } from '../data';
import { Segmented } from '../components/Segmented';
import { fromKey, keysBetween, shiftKey, weekStartOf, WEEKDAY_LETTER } from '../lib/dates';
import { categoryStats, rangeProgress, ratio, streak, sumProgress, dayProgress } from '../lib/stats';

const pct = (v: number) => `${Math.round(v * 100)}%`;

function heatColor(r: number, total: number) {
  if (!total) return 'var(--surface-2)';
  if (r === 0) return 'var(--surface-3)';
  if (r >= 1) return 'var(--g3)';
  if (r < 0.34) return 'color-mix(in srgb, var(--g1) 55%, var(--surface-3))';
  if (r < 0.67) return 'color-mix(in srgb, var(--g1) 50%, var(--g2))';
  return 'var(--g2)';
}

export function Progress() {
  const { tasks, categories, catMap, done, today, settings } = useData();
  const [range, setRange] = useState<'7' | '30'>('7');

  const last30 = useMemo(() => rangeProgress(tasks, done, today, 30), [tasks, done, today]);
  const last7 = last30.slice(-7);
  const todayP = last30[last30.length - 1];
  const bars = range === '7' ? last7 : last30;

  // Perfect-day streak (days with tasks where everything got done; empty days are skipped).
  const perfect = useMemo(() => {
    let n = 0;
    for (let k = today, i = 0; i < 366; i++, k = shiftKey(k, -1)) {
      const p = dayProgress(tasks, done, k);
      if (!p.total) continue;
      if (p.done === p.total) n++;
      else if (k !== today) break;
    }
    return n;
  }, [tasks, done, today]);

  const heat = useMemo(() => {
    const start = weekStartOf(shiftKey(today, -7 * 11), settings.weekStart);
    const end = shiftKey(start, 7 * 12 - 1);
    return keysBetween(start, end).map((k) => (k > today ? { k, future: true as const } : { k, p: dayProgress(tasks, done, k) }));
  }, [tasks, done, today, settings.weekStart]);

  const recurring = tasks.filter((t) => t.kind !== 'once' && !t.archivedAt);
  const streaks = recurring
    .map((t) => ({ t, s: streak(t, done, today) }))
    .sort((a, b) => b.s.current - a.s.current || b.s.best - a.s.best);

  const cats = useMemo(
    () => categoryStats(tasks, categories, done, keysBetween(shiftKey(today, -29), today)).sort((a, b) => ratio(b) - ratio(a)),
    [tasks, categories, done, today],
  );

  const max = Math.max(1, ...bars.map((b) => b.total));

  return (
    <>
      <h1 className="screen-title">Progress</h1>
      <p className="screen-sub">How you’ve been showing up.</p>

      <div className="stat-grid">
        <div className="stat">
          <b className="grad-text">{pct(ratio(todayP))}</b>
          <span>Today</span>
        </div>
        <div className="stat">
          <b>{pct(ratio(sumProgress(last7)))}</b>
          <span>Last 7 days</span>
        </div>
        <div className="stat">
          <b>{pct(ratio(sumProgress(last30)))}</b>
          <span>Last 30 days</span>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <h3 className="card-title" style={{ margin: 0, flex: 1 }}>Completed per day</h3>
          <div style={{ width: 130 }}>
            <Segmented value={range} options={[{ value: '7', label: '7d' }, { value: '30', label: '30d' }]} onChange={setRange} />
          </div>
        </div>
        <div className="chart-bars" style={{ gap: range === '7' ? 10 : 3 }}>
          {bars.map((b, i) => (
            <div className="col" key={b.day}>
              <div
                className={`b ${b.done ? '' : 'zero'}`}
                style={{ height: `${(b.done / max) * 100}%`, opacity: b.total && b.done === b.total ? 1 : 0.75 }}
                title={`${b.done}/${b.total}`}
              />
              <span className="l">
                {range === '7'
                  ? WEEKDAY_LETTER[fromKey(b.day).getDay()]
                  : i % 5 === 4 || b.day === today
                    ? fromKey(b.day).getDate()
                    : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <h3 className="card-title" style={{ margin: 0, flex: 1 }}>Last 12 weeks</h3>
          <span className="note">
            🔥 <b style={{ color: 'var(--text)' }}>{perfect}</b> perfect day{perfect === 1 ? '' : 's'} in a row
          </span>
        </div>
        <div className="heatmap">
          {heat.map((h) =>
            'future' in h ? (
              <div key={h.k} className="cell future" />
            ) : (
              <div
                key={h.k}
                className="cell"
                title={`${format(fromKey(h.k), 'MMM d')}: ${h.p.done}/${h.p.total}`}
                style={{
                  background: heatColor(ratio(h.p), h.p.total),
                  boxShadow: h.k === today ? '0 0 0 1.5px var(--text)' : undefined,
                }}
              />
            ),
          )}
        </div>
        <div className="heat-legend">
          Less
          {[0, 0.2, 0.5, 0.8, 1].map((r) => (
            <span key={r} className="cell" style={{ background: heatColor(r, 1) }} />
          ))}
          More
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Streaks</h3>
        {streaks.length === 0 && <p className="note">Add a daily habit or weekly task to start a streak.</p>}
        {streaks.map(({ t, s }) => (
          <div className="streak-row" key={t.id}>
            <span className="color-dot" style={{ ['--cat' as string]: (t.categoryId && catMap.get(t.categoryId)?.color) || FALLBACK_COLOR }} />
            <span className="name">{t.title}</span>
            <span className={`cur ${s.current > 0 ? 'grad-text' : ''}`} style={{ color: s.current ? undefined : 'var(--faint)' }}>
              {s.current > 0 ? '🔥 ' : ''}
              {s.current}
            </span>
            <span className="best">best {s.best}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card-title">By category · 30 days</h3>
        {cats.length === 0 && <p className="note">No tasks scheduled yet.</p>}
        {cats.map((c) => (
          <div className="cat-stat" key={c.id ?? 'none'} style={{ ['--cat' as string]: c.color }}>
            <div className="head">
              <span className="row" style={{ gap: 8 }}>
                <span className="color-dot" /> {c.name}
              </span>
              <span>
                {pct(ratio(c))} <span className="note">· {c.done}/{c.total}</span>
              </span>
            </div>
            <div className="bar">
              <div style={{ width: pct(ratio(c)) }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
