import { defaultFilters, ItemFilters, type ListFilters } from './ItemFilters';

export const FilterModal = ({
  open,
  filters,
  onChange,
  onReset,
  onClose,
}: {
  open: boolean;
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
  onReset: () => void;
  onClose: () => void;
}) => {
  const hasNonDefaultFilters =
    filters.checked !== defaultFilters.checked ||
    filters.priority !== defaultFilters.priority ||
    filters.sort !== defaultFilters.sort ||
    filters.favoritesOnly !== defaultFilters.favoritesOnly ||
    filters.runningLowOnly !== defaultFilters.runningLowOnly;

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`} role="dialog" aria-modal="true">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-bold">Filters</h3>
        <p className="mt-1 text-sm text-base-content/70">Apply filters to the current list view.</p>

        <div className="mt-4">
          <ItemFilters filters={filters} onChange={onChange} variant="plain" />
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onReset} disabled={!hasNonDefaultFilters}>
            Reset
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
};
