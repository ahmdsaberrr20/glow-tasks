import { useEffect, useState } from 'react';
import { deleteCategory, saveCategory, type Category } from '../db';
import { ColorSwatches, PALETTE } from './ColorSwatches';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  category?: Category | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export function CategorySheet({ open, category, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setColor(category?.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  }, [open, category]);

  const save = async () => {
    const id = await saveCategory({ id: category?.id, name: name.trim(), color });
    onSaved?.(id);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h2>{category ? 'Edit category' : 'New category'}</h2>
      <div className="field">
        <label>Name</label>
        <input
          className="input"
          value={name}
          placeholder="e.g. Fitness"
          onChange={(e) => setName(e.target.value)}
          style={{ borderColor: color }}
        />
      </div>
      <div className="field">
        <label>Color</label>
        <ColorSwatches value={color} onChange={setColor} />
      </div>
      <div className="field" style={{ marginTop: 20 }}>
        <span className="chip" style={{ ['--cat' as string]: color, fontSize: 14, padding: '6px 12px' }}>
          <span className="dot" /> {name || 'Preview'}
        </span>
      </div>
      <div className="sheet-actions">
        {category && (
          <button
            className="btn danger"
            onClick={async () => {
              if (confirm(`Delete “${category.name}”? Its tasks will become uncategorized.`)) {
                await deleteCategory(category.id);
                onClose();
              }
            }}
          >
            Delete
          </button>
        )}
        <button className="btn primary" disabled={!name.trim()} onClick={save}>
          Save
        </button>
      </div>
    </Sheet>
  );
}
