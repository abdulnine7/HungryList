import { useEffect, useMemo, useState } from 'react';

import type { ApiError } from '../lib/api';
import type { Item, Priority, Section } from '../lib/types';

type ItemFormState = {
  sectionId: string;
  name: string;
  description: string;
  priority: Priority;
  remindEveryDays: number;
};

const emptyForm = (sectionId: string): ItemFormState => ({
  sectionId,
  name: '',
  description: '',
  priority: 'soon',
  remindEveryDays: 0,
});

export const ItemModal = ({
  open,
  mode,
  item,
  sections,
  fallbackSectionId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  item?: Item;
  sections: Section[];
  fallbackSectionId: string;
  onClose: () => void;
  onSubmit: (payload: ItemFormState) => Promise<void>;
}) => {
  const [form, setForm] = useState<ItemFormState>(emptyForm(fallbackSectionId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const modalTitle = mode === 'create' ? 'Add Item' : 'Edit Item';

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && item) {
      setForm({
        sectionId: item.sectionId,
        name: item.name,
        description: item.description,
        priority: item.priority,
        remindEveryDays: item.remindEveryDays,
      });
      setError('');
      return;
    }

    setForm(emptyForm(fallbackSectionId));
    setError('');
  }, [open, mode, item, fallbackSectionId]);

  const canSubmit = useMemo(() => form.name.trim().length > 0 && !!form.sectionId, [form.name, form.sectionId]);

  const patchForm = (patch: Partial<ItemFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    if (error) {
      setError('');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
      });
      onClose();
    } catch (requestError) {
      const typedError = requestError as ApiError;
      setError(typedError.message || 'Unable to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`} role="dialog" aria-modal="true">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">{modalTitle}</h3>

        <form className="mt-4 space-y-4" onSubmit={submit}>
          {error ? <div className="alert alert-error text-sm">{error}</div> : null}

          <label className="form-control">
            <span className="label-text">Section</span>
            <select
              className="select select-bordered"
              value={form.sectionId}
              onChange={(event) => patchForm({ sectionId: event.target.value })}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.icon} {section.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">Name</span>
            <input
              className="input input-bordered"
              value={form.name}
              onChange={(event) => patchForm({ name: event.target.value })}
              placeholder="e.g. Basmati Rice"
              maxLength={120}
              autoFocus
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text">Description</span>
            <textarea
              className="textarea textarea-bordered"
              value={form.description}
              onChange={(event) => patchForm({ description: event.target.value })}
              placeholder="Optional details"
              maxLength={500}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text">Priority</span>
              <select
                className="select select-bordered"
                value={form.priority}
                onChange={(event) => patchForm({ priority: event.target.value as Priority })}
              >
                <option value="must">Must</option>
                <option value="soon">Soon</option>
                <option value="optional">Optional</option>
              </select>
            </label>

            <label className="form-control">
              <span className="label-text">Remind Every (days)</span>
              <input
                className="input input-bordered"
                type="number"
                min={0}
                max={365}
                value={form.remindEveryDays}
                onChange={(event) => patchForm({ remindEveryDays: Number(event.target.value || 0) })}
              />
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${submitting ? 'loading' : ''}`} disabled={!canSubmit || submitting}>
              {mode === 'create' ? 'Add Item' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
};
