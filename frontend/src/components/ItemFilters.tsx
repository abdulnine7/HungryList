import type { Priority } from '../lib/types';

export type ListFilters = {
  checked: 'all' | 'checked' | 'unchecked';
  priority: Priority | 'all';
  sort: 'updated_desc' | 'name_asc' | 'priority' | 'created_desc';
  favoritesOnly: boolean;
  runningLowOnly: boolean;
};

export const defaultFilters: ListFilters = {
  checked: 'all',
  priority: 'all',
  sort: 'updated_desc',
  favoritesOnly: false,
  runningLowOnly: false,
};

export const ItemFilters = ({
  filters,
  onChange,
  variant = 'card',
}: {
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
  variant?: 'card' | 'plain';
}) => {
  const controls = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="form-control">
        <span className="label-text text-xs uppercase tracking-wide">Checked</span>
        <select
          className="select select-bordered select-sm"
          value={filters.checked}
          onChange={(event) => onChange({ ...filters, checked: event.target.value as ListFilters['checked'] })}
        >
          <option value="all">All</option>
          <option value="checked">Checked</option>
          <option value="unchecked">Unchecked</option>
        </select>
      </label>

      <label className="form-control">
        <span className="label-text text-xs uppercase tracking-wide">Priority</span>
        <select
          className="select select-bordered select-sm"
          value={filters.priority}
          onChange={(event) => onChange({ ...filters, priority: event.target.value as ListFilters['priority'] })}
        >
          <option value="all">All</option>
          <option value="must">Must</option>
          <option value="soon">Soon</option>
          <option value="optional">Optional</option>
        </select>
      </label>

      <label className="form-control">
        <span className="label-text text-xs uppercase tracking-wide">Sort</span>
        <select
          className="select select-bordered select-sm"
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as ListFilters['sort'] })}
        >
          <option value="updated_desc">Recently Updated</option>
          <option value="created_desc">Recently Added</option>
          <option value="name_asc">Name A-Z</option>
          <option value="priority">Priority</option>
        </select>
      </label>

      <label className="label cursor-pointer justify-start gap-2 rounded-box border border-base-300 px-3">
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          checked={filters.favoritesOnly}
          onChange={(event) => onChange({ ...filters, favoritesOnly: event.target.checked })}
        />
        <span className="label-text text-sm">Favorites only</span>
      </label>

      <label className="label cursor-pointer justify-start gap-2 rounded-box border border-base-300 px-3">
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          checked={filters.runningLowOnly}
          onChange={(event) => onChange({ ...filters, runningLowOnly: event.target.checked })}
        />
        <span className="label-text text-sm">Running low only</span>
      </label>
    </div>
  );

  if (variant === 'plain') {
    return controls;
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        {controls}
      </div>
    </div>
  );
};
