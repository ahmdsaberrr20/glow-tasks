export const PALETTE = [
  '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399', '#2DD4BF', '#22D3EE',
  '#60A5FA', '#818CF8', '#A78BFA', '#E879F9', '#F472B6', '#94A3B8',
];

export function ColorSwatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const isCustom = !PALETTE.includes(value);
  return (
    <div className="swatches">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          className={`swatch ${value === c ? 'on' : ''}`}
          style={{ ['--c' as string]: c }}
          onClick={() => onChange(c)}
        />
      ))}
      <label
        className={`swatch custom ${isCustom ? 'on' : ''}`}
        style={{ ['--c' as string]: isCustom ? value : 'transparent' }}
        aria-label="Custom color"
      >
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} />
      </label>
    </div>
  );
}
