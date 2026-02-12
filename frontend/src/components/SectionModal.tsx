import { useEffect, useMemo, useState } from 'react';

import type { ApiError } from '../lib/api';
import type { Section } from '../lib/types';

const starterState = {
  name: '',
  icon: '🛒',
  color: '#2563eb',
};

export const SectionModal = ({
  open,
  section,
  onClose,
  onSubmit,
}: {
  open: boolean;
  section?: Section;
  onClose: () => void;
  onSubmit: (payload: { name: string; icon: string; color: string }) => Promise<void>;
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const [color, setColor] = useState('#2563eb');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    if (section) {
      setName(section.name);
      setIcon(section.icon);
      setColor(section.color);
    } else {
      setName(starterState.name);
      setIcon(starterState.icon);
      setColor(starterState.color);
    }

    setError('');
  }, [open, section]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const clearError = () => {
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
        name: name.trim(),
        icon: icon.trim(),
        color,
      });
      onClose();
    } catch (requestError) {
      const typedError = requestError as ApiError;
      setError(typedError.message || 'Unable to save section.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`} role="dialog" aria-modal="true">
      <div className="modal-box max-w-md">
        <h3 className="text-lg font-bold">{section ? 'Edit Section' : 'Add Section'}</h3>
        <form className="mt-4 space-y-4" onSubmit={submit}>
          {error ? <div className="alert alert-error text-sm">{error}</div> : null}

          <label className="form-control">
            <span className="label-text">Name</span>
            <input
              className="input input-bordered"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearError();
              }}
              placeholder="Section name"
              maxLength={64}
              required
              autoFocus
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text">Icon</span>
              <input
                className="input input-bordered"
                value={icon}
                onChange={(event) => {
                  setIcon(event.target.value);
                  clearError();
                }}
                placeholder="🛒"
                maxLength={10}
              />
            </label>

            <label className="form-control">
              <span className="label-text">Color</span>
              <input
                className="input input-bordered h-12"
                type="color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value);
                  clearError();
                }}
              />
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${submitting ? 'loading' : ''}`} disabled={!canSubmit || submitting}>
              {section ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
};
