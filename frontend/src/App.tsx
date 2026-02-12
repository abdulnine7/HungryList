import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BackupRestoreModal } from './components/BackupRestoreModal';
import { ItemCard } from './components/ItemCard';
import { defaultFilters, ItemFilters, type ListFilters } from './components/ItemFilters';
import { ItemModal } from './components/ItemModal';
import { LoginView } from './components/LoginView';
import { SectionChips } from './components/SectionChips';
import { SectionModal } from './components/SectionModal';
import { TabNavigation } from './components/TabNavigation';
import { ThemeToggle } from './components/ThemeToggle';
import { useToast } from './components/ToastProvider';
import { usePersistentState } from './hooks/usePersistentState';
import { useTheme } from './hooks/useTheme';
import { api, ApiError } from './lib/api';
import type { ActiveTab, BackupRecord, Item, Section } from './lib/types';
import { SettingsView } from './views/SettingsView';

const listTabs: ActiveTab[] = ['myList', 'nextTrip', 'favorites', 'runningLow', 'reminders'];

const emptyItems: Item[] = [];

function App() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = usePersistentState<ActiveTab>('hungrylist.activeTab', 'myList');
  const [selectedSectionId, setSelectedSectionId] = usePersistentState<string>(
    'hungrylist.selectedSectionId',
    '',
  );
  const [secondarySectionFilter, setSecondarySectionFilter] = usePersistentState<string | 'all'>(
    'hungrylist.secondarySectionFilter',
    'all',
  );
  const [search, setSearch] = usePersistentState<string>('hungrylist.search', '');
  const [filters, setFilters] = usePersistentState<ListFilters>('hungrylist.filters', defaultFilters);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>();

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | undefined>();

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<BackupRecord | undefined>();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: api.getSession,
    retry: false,
  });

  const authenticated = sessionQuery.isSuccess;
  const authError = sessionQuery.error as ApiError | undefined;

  const sectionsQuery = useQuery({
    queryKey: ['sections'],
    queryFn: api.listSections,
    enabled: authenticated,
  });

  const sections = sectionsQuery.data ?? [];

  useEffect(() => {
    if (!sections.length) {
      return;
    }

    const selectedExists = sections.some((section) => section.id === selectedSectionId);
    if (!selectedSectionId || !selectedExists) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId, setSelectedSectionId]);

  useEffect(() => {
    if (secondarySectionFilter === 'all') {
      return;
    }

    const filterExists = sections.some((section) => section.id === secondarySectionFilter);
    if (!filterExists) {
      setSecondarySectionFilter('all');
    }
  }, [secondarySectionFilter, sections, setSecondarySectionFilter]);

  const itemQueryParams = useMemo(() => {
    if (!listTabs.includes(activeTab)) {
      return null;
    }

    const sectionId =
      activeTab === 'myList'
        ? selectedSectionId || undefined
        : secondarySectionFilter === 'all'
          ? undefined
          : secondarySectionFilter;

    return {
      view: activeTab,
      sectionId,
      search: activeTab === 'myList' ? search : undefined,
      checked: filters.checked,
      priority: filters.priority,
      sort: filters.sort,
      favoritesOnly: filters.favoritesOnly,
      runningLowOnly: filters.runningLowOnly,
    };
  }, [activeTab, filters, search, secondarySectionFilter, selectedSectionId]);

  const itemsQuery = useQuery({
    queryKey: ['items', itemQueryParams],
    queryFn: () => api.listItems(itemQueryParams ?? { view: 'myList' }),
    enabled: authenticated && !!itemQueryParams,
    placeholderData: emptyItems,
  });

  const backupsQuery = useQuery({
    queryKey: ['backups'],
    queryFn: api.listBackups,
    enabled: authenticated,
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      notify('Welcome back to HungryList.', 'success');
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: api.logoutAll,
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const itemCreateMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: (result) => {
      notify(result.restored ? 'Item restored from previously deleted entry.' : 'Item added.', 'success');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const itemUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof api.updateItem>[1] }) =>
      api.updateItem(id, payload),
    onSuccess: () => {
      notify('Item updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const itemDeleteMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      notify('Item deleted.', 'success');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const sectionCreateMutation = useMutation({
    mutationFn: api.createSection,
    onSuccess: (section) => {
      notify('Section created.', 'success');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      setSelectedSectionId(section.id);
    },
  });

  const sectionUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof api.updateSection>[1] }) =>
      api.updateSection(id, payload),
    onSuccess: () => {
      notify('Section updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const sectionDeleteMutation = useMutation({
    mutationFn: api.deleteSection,
    onSuccess: () => {
      notify('Section deleted.', 'success');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const backupCreateMutation = useMutation({
    mutationFn: api.createBackup,
    onSuccess: () => {
      notify('Backup created.', 'success');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  const backupRestoreMutation = useMutation({
    mutationFn: ({ id, createCurrentBackup }: { id: string; createCurrentBackup: boolean }) =>
      api.restoreBackup(id, createCurrentBackup),
    onSuccess: () => {
      notify('Backup restored. Please log in again.', 'info');
      queryClient.clear();
      window.setTimeout(() => {
        window.location.reload();
      }, 250);
    },
  });

  const handleItemCheckToggle = async (item: Item) => {
    try {
      await api.toggleItemChecked(item.id);
      queryClient.invalidateQueries({ queryKey: ['items'] });
    } catch (error) {
      const typedError = error as ApiError;
      notify(typedError.message, 'error');
    }
  };

  const handleFavoriteToggle = async (item: Item) => {
    try {
      await api.toggleItemFavorite(item.id);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      notify(item.favorite ? 'Removed from favorites.' : 'Added to favorites.', 'success');
    } catch (error) {
      const typedError = error as ApiError;
      notify(typedError.message, 'error');
    }
  };

  const handleRunningLowToggle = async (item: Item) => {
    try {
      await api.toggleItemRunningLow(item.id);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      notify(item.runningLow ? 'Running low cleared.' : 'Marked as running low.', 'success');
    } catch (error) {
      const typedError = error as ApiError;
      notify(typedError.message, 'error');
    }
  };

  const handleDeleteItem = async (item: Item) => {
    const confirmed = window.confirm(`Delete "${item.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await itemDeleteMutation.mutateAsync(item.id);
    } catch (error) {
      const typedError = error as ApiError;
      notify(typedError.message, 'error');
    }
  };

  if (sessionQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="loading loading-ring loading-lg" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <LoginView
        onLogin={async (payload) => {
          await loginMutation.mutateAsync(payload);
        }}
        loading={loginMutation.isPending}
      />
    );
  }

  const items = itemsQuery.data ?? [];
  const backups = backupsQuery.data ?? [];

  const itemSectionLookup = sections.reduce<Record<string, Section>>((acc, section) => {
    acc[section.id] = section;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gradient-to-b from-base-200/40 via-base-100 to-base-200/70 pb-24">
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">HungryList</h1>
            <p className="text-sm text-base-content/70">Single-household grocery planner</p>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <TabNavigation activeTab={activeTab} onChange={setActiveTab} />

        <section className="mt-4 space-y-4">
          {activeTab === 'myList' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="form-control">
                <span className="label-text text-xs uppercase tracking-wide">Section</span>
                <select
                  className="select select-bordered"
                  value={selectedSectionId}
                  onChange={(event) => setSelectedSectionId(event.target.value)}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.icon} {section.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text text-xs uppercase tracking-wide">Search</span>
                <label className="input input-bordered flex items-center gap-2">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search items"
                  />
                </label>
              </label>
            </div>
          ) : null}

          {activeTab !== 'myList' && activeTab !== 'settings' ? (
            <SectionChips
              sections={sections}
              selected={secondarySectionFilter}
              onSelect={setSecondarySectionFilter}
            />
          ) : null}

          {activeTab !== 'settings' ? <ItemFilters filters={filters} onChange={setFilters} /> : null}

          {activeTab === 'settings' ? (
            <SettingsView
              sections={sections}
              backups={backups}
              onAddSection={() => {
                setEditingSection(undefined);
                setSectionModalOpen(true);
              }}
              onEditSection={(section) => {
                setEditingSection(section);
                setSectionModalOpen(true);
              }}
              onDeleteSection={async (section) => {
                if (!window.confirm(`Delete section "${section.name}"?`)) {
                  return;
                }

                try {
                  await sectionDeleteMutation.mutateAsync(section.id);
                } catch (error) {
                  const typedError = error as ApiError;
                  notify(typedError.message, 'error');
                }
              }}
              onCreateBackup={async () => {
                try {
                  await backupCreateMutation.mutateAsync();
                } catch (error) {
                  const typedError = error as ApiError;
                  notify(typedError.message, 'error');
                }
              }}
              onRestoreBackup={(backup) => {
                setRestoringBackup(backup);
                setRestoreModalOpen(true);
              }}
              onLogoutAll={async () => {
                if (!window.confirm('Log out all trusted devices?')) {
                  return;
                }

                try {
                  await logoutAllMutation.mutateAsync();
                } catch (error) {
                  const typedError = error as ApiError;
                  notify(typedError.message, 'error');
                }
              }}
              onLogout={async () => {
                try {
                  await logoutMutation.mutateAsync();
                } catch (error) {
                  const typedError = error as ApiError;
                  notify(typedError.message, 'error');
                }
              }}
            />
          ) : itemsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : items.length === 0 ? (
            <div className="alert">
              <span>No items found for current filters.</span>
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  section={itemSectionLookup[item.sectionId]}
                  onToggleChecked={handleItemCheckToggle}
                  onToggleFavorite={handleFavoriteToggle}
                  onToggleRunningLow={handleRunningLowToggle}
                  onEdit={(target) => {
                    setEditingItem(target);
                    setItemModalOpen(true);
                  }}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {activeTab !== 'settings' ? (
        <button
          type="button"
          className="btn btn-primary btn-circle btn-lg fixed bottom-6 right-6 shadow-xl"
          aria-label="Add item"
          onClick={() => {
            setEditingItem(undefined);
            setItemModalOpen(true);
          }}
        >
          <Plus size={22} />
        </button>
      ) : null}

      <ItemModal
        open={itemModalOpen}
        mode={editingItem ? 'edit' : 'create'}
        item={editingItem}
        sections={sections}
        fallbackSectionId={selectedSectionId || sections[0]?.id || ''}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(undefined);
        }}
        onSubmit={async (payload) => {
          if (editingItem) {
            await itemUpdateMutation.mutateAsync({ id: editingItem.id, payload });
            return;
          }

          await itemCreateMutation.mutateAsync(payload);
        }}
      />

      <SectionModal
        open={sectionModalOpen}
        section={editingSection}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(undefined);
        }}
        onSubmit={async (payload) => {
          if (editingSection) {
            await sectionUpdateMutation.mutateAsync({ id: editingSection.id, payload });
            return;
          }

          await sectionCreateMutation.mutateAsync(payload);
        }}
      />

      <BackupRestoreModal
        backup={restoringBackup}
        open={restoreModalOpen}
        onClose={() => {
          setRestoreModalOpen(false);
          setRestoringBackup(undefined);
        }}
        onConfirm={async (backupId, createCurrentBackup) => {
          await backupRestoreMutation.mutateAsync({ id: backupId, createCurrentBackup });
        }}
      />

      {authError?.status && authError.status !== 401 ? (
        <div className="toast toast-bottom toast-start">
          <div className="alert alert-error text-sm">
            <span>{authError.message}</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
