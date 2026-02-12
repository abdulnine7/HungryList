import clsx from 'clsx';
import { AlertTriangle, Heart, Pencil, Trash2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import type { Item, Section } from '../lib/types';

const priorityClassMap: Record<Item['priority'], string> = {
  must: 'badge-error',
  soon: 'badge-warning',
  optional: 'badge-ghost',
};

export const ItemCard = ({
  item,
  section,
  onToggleChecked,
  onToggleFavorite,
  onToggleRunningLow,
  onEdit,
  onDelete,
  showActions = true,
}: {
  item: Item;
  section?: Section;
  onToggleChecked: (item: Item) => void;
  onToggleFavorite: (item: Item) => void;
  onToggleRunningLow: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  showActions?: boolean;
}) => {
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleChecked(item);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggleChecked(item)}
      onKeyDown={handleRowKeyDown}
      className={clsx(
        'card w-full cursor-pointer border border-base-300 bg-base-100 text-left shadow-sm transition-colors hover:border-primary/40',
        { 'opacity-70': item.checked },
      )}
      aria-label={`Toggle ${item.name}`}
    >
      <div className="card-body gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className={clsx('text-lg font-bold leading-tight', { 'line-through': item.checked })}>{item.name}</h3>
            {item.description ? <p className="text-sm text-base-content/70">{item.description}</p> : null}
          </div>
          <input
            type="checkbox"
            checked={item.checked}
            readOnly
            onClick={(event) => {
              event.stopPropagation();
              onToggleChecked(item);
            }}
            className="checkbox checkbox-primary checkbox-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={clsx('badge badge-sm capitalize', priorityClassMap[item.priority])}>{item.priority}</span>
          {item.favorite ? <span className="badge badge-sm badge-secondary">Favorite</span> : null}
          {item.runningLow ? <span className="badge badge-sm badge-accent">Running Low</span> : null}
          {item.reminderDue ? <span className="badge badge-sm badge-info">Reminder Due</span> : null}
          {section ? (
            <span className="badge badge-sm badge-outline" style={{ borderColor: section.color }}>
              {section.icon} {section.name}
            </span>
          ) : null}
        </div>

        {showActions ? (
          <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={clsx('btn btn-sm btn-outline', { 'btn-secondary': item.favorite })}
              aria-label={item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
              onClick={() => onToggleFavorite(item)}
            >
              <Heart size={14} fill={item.favorite ? 'currentColor' : 'none'} />
              Favorite
            </button>

            <button
              type="button"
              className={clsx('btn btn-sm btn-outline', { 'btn-accent': item.runningLow })}
              aria-label={`Toggle running low for ${item.name}`}
              onClick={() => onToggleRunningLow(item)}
            >
              <AlertTriangle size={14} />
              Running Low
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              aria-label={`Edit ${item.name}`}
              onClick={() => onEdit(item)}
            >
              <Pencil size={14} />
              Edit
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline btn-error"
              aria-label={`Delete ${item.name}`}
              onClick={() => onDelete(item)}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
