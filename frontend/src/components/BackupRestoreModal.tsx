import { useEffect, useState } from 'react';

import type { ApiError } from '../lib/api';
import type { BackupRecord } from '../lib/types';

export const BackupRestoreModal = ({
  backup,
  open,
  onClose,
  onConfirm,
}: {
  backup?: BackupRecord;
  open: boolean;
  onClose: () => void;
  onConfirm: (backupId: string, createCurrentBackup: boolean) => Promise<void>;
}) => {
  const [createCurrentBackup, setCreateCurrentBackup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCreateCurrentBackup(true);
      setError('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!backup || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(backup.id, createCurrentBackup);
      onClose();
    } catch (requestError) {
      const typedError = requestError as ApiError;
      setError(typedError.message || 'Restore failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`} role="dialog" aria-modal="true">
      <div className="modal-box max-w-md">
        <h3 className="text-lg font-bold">Restore Backup</h3>
        <p className="mt-2 text-sm text-base-content/75">
          Restoring this backup will replace your current grocery data.
        </p>

        {backup ? (
          <div className="alert mt-3 bg-base-200 text-sm">
            <span>{backup.filename}</span>
          </div>
        ) : null}

        {error ? <div className="alert alert-error mt-3 text-sm">{error}</div> : null}

        <label className="label mt-3 cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={createCurrentBackup}
            onChange={(event) => {
              setCreateCurrentBackup(event.target.checked);
              if (error) {
                setError('');
              }
            }}
          />
          <span className="label-text">Create current backup before restore</span>
        </label>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`btn btn-warning ${submitting ? 'loading' : ''}`} onClick={handleConfirm}>
            Create Backup & Restore
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
};
