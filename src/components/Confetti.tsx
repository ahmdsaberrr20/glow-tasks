import { useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['var(--g1)', 'var(--g2)', 'var(--g3)', '#fff'];

/** A one-shot burst; bump `burst` to fire again. Pure CSS animation (see .confetti in theme.css). */
export function Confetti({ burst }: { burst: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const w = 6 + Math.random() * 6;
        return {
          background: COLORS[i % COLORS.length],
          width: w,
          height: w * 1.4,
          animationDelay: `${Math.random() * 0.15}s`,
          '--x': `${(Math.random() - 0.5) * 110}vw`,
          '--y': `${-Math.random() * 35 - 8}vh`,
          '--fall': `${55 + Math.random() * 40}vh`,
          '--r': `${Math.random() * 720 - 360}deg`,
        } as CSSProperties;
      }),
    [burst],
  );
  if (!burst) return null;
  return createPortal(
    <div className="confetti" key={burst}>
      {pieces.map((style, i) => (
        <i key={i} style={style} />
      ))}
    </div>,
    document.body,
  );
}
