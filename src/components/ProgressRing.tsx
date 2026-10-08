import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  children?: ReactNode;
}

export function ProgressRing({ value, size = 112, stroke = 11, children }: Props) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--g1)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--g2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--g3)' }} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {v === 1 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} filter={`url(#${id}-glow)`} opacity={0.7} />
        )}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v), opacity: v === 0 ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}
