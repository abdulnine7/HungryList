import { DatabaseBackup, LogOut, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

import type { BackupRecord, Section } from '../lib/types';

export const SettingsView = ({
  sections,
  backups,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onCreateBackup,
  onRestoreBackup,
  onLogoutAll,
  onLogout,
}: {
  sections: Section[];
  backups: BackupRecord[];
  onAddSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onCreateBackup: () => void;
  onRestoreBackup: (backup: BackupRecord) => void;
  onLogoutAll: () => void;
  onLogout: () => void;
}) => {
  return (
    <div className="grid gap-4">
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Sections</h2>
            <button type="button" className="btn btn-sm btn-primary" onClick={onAddSection}>
              <Plus size={14} />
              Add Section
            </button>
          </div>

          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-wrap items-center justify-between gap-2 rounded-box border border-base-300 p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                  <span className="badge badge-outline" style={{ borderColor: section.color }}>
                    {section.color}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    aria-label={`Edit section ${section.name}`}
                    onClick={() => onEditSection(section)}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-error"
                    aria-label={`Delete section ${section.name}`}
                    onClick={() => onDeleteSection(section)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Backups</h2>
            <button type="button" className="btn btn-sm btn-secondary" onClick={onCreateBackup}>
              <DatabaseBackup size={14} />
              Create Backup
            </button>
          </div>

          <p className="text-sm text-base-content/70">Automatic backup runs on the 1st day of every month.</p>

          <div className="space-y-2">
            {backups.length === 0 ? <p className="text-sm text-base-content/70">No backups yet.</p> : null}
            {backups.map((backup) => (
              <div key={backup.id} className="flex flex-wrap items-center justify-between gap-2 rounded-box border border-base-300 p-3">
                <div>
                  <p className="font-medium">{backup.filename}</p>
                  <p className="text-xs text-base-content/60">
                    {new Date(backup.created_at).toLocaleString()} · {backup.reason}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-warning"
                  onClick={() => onRestoreBackup(backup)}
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="text-lg font-semibold">Security</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline w-full sm:w-fit" onClick={onLogout}>
              <LogOut size={14} />
              Log Out This Device
            </button>
            <button type="button" className="btn btn-outline w-full sm:w-fit" onClick={onLogoutAll}>
              <LogOut size={14} />
              Log Out All Devices
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
