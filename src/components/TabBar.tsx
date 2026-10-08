import { motion } from 'framer-motion';
import { IconChart, IconGrid, IconToday, IconWeek } from './Icons';

export type Tab = 'today' | 'week' | 'progress' | 'manage';

const TABS: { id: Tab; label: string; Icon: typeof IconToday }[] = [
  { id: 'today', label: 'Today', Icon: IconToday },
  { id: 'week', label: 'Week', Icon: IconWeek },
  { id: 'progress', label: 'Progress', Icon: IconChart },
  { id: 'manage', label: 'Manage', Icon: IconGrid },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {/* Shared gradient referenced by the active tab icon's stroke */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="tab-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--g1)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--g2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--g3)' }} />
          </linearGradient>
        </defs>
      </svg>
      <div className="tabbar-inner">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => onChange(id)}>
            {tab === id && <motion.div layoutId="tab-dot" className="tab-dot" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
