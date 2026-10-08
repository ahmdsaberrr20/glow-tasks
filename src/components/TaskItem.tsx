import { AnimatePresence, motion } from 'framer-motion';
import type { Category, Task } from '../db';
import { FALLBACK_COLOR } from '../data';
import { describeSchedule } from '../lib/schedule';
import { IconCheck, IconMore, IconRepeat } from './Icons';

interface Props {
  task: Task;
  category?: Category;
  done: boolean;
  streak?: number;
  onToggle: () => void;
  onEdit: () => void;
}

export function TaskItem({ task, category, done, streak, onToggle, onEdit }: Props) {
  const color = category?.color ?? FALLBACK_COLOR;
  return (
    <motion.div
      layout
      className={`task ${done ? 'done' : ''}`}
      style={{ ['--cat' as string]: color }}
      onClick={() => {
        navigator.vibrate?.(12);
        onToggle();
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      <div className="task-check">
        <AnimatePresence>
          {done && (
            <motion.div
              className="fill"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 22 }}
            >
              <IconCheck />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {category && (
            <span className="chip">
              <span className="dot" />
              {category.name}
            </span>
          )}
          {task.kind === 'weekly' && (
            <span className="row" style={{ gap: 4 }}>
              <IconRepeat /> {describeSchedule(task)}
            </span>
          )}
          {!!streak && streak > 1 && <span>🔥 {streak}</span>}
          {task.notes && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{task.notes}</span>}
        </div>
      </div>
      <button
        className="task-edit"
        aria-label="Edit task"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <IconMore />
      </button>
    </motion.div>
  );
}
