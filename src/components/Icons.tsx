import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

type P = SVGProps<SVGSVGElement>;

export const IconToday = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
);
export const IconWeek = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base({ strokeWidth: 2.6, ...p })}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base({ strokeWidth: 3.2, width: 16, height: 16, ...p })}><path d="m5 12 5 5 9-10" /></svg>
);
export const IconMore = (p: P) => (
  <svg {...base(p)}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
);
export const IconLeft = (p: P) => <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>;
export const IconRight = (p: P) => <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>;
export const IconUp = (p: P) => <svg {...base({ width: 16, height: 16, ...p })}><path d="m18 15-6-6-6 6" /></svg>;
export const IconDown = (p: P) => <svg {...base({ width: 16, height: 16, ...p })}><path d="m6 9 6 6 6-6" /></svg>;
export const IconRepeat = (p: P) => (
  <svg {...base({ width: 12, height: 12, ...p })}><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
);
export const IconFlame = (p: P) => (
  <svg {...base({ width: 16, height: 16, ...p })}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
);
