import clsx from 'clsx';

import type { ActiveTab } from '../lib/types';

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: 'myList', label: 'My List' },
  { id: 'nextTrip', label: 'Next Trip' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'runningLow', label: 'Running Low' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'settings', label: 'Settings' },
];

export const TabNavigation = ({
  activeTab,
  onChange,
}: {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}) => {
  return (
    <div className="overflow-x-auto">
      <div className="tabs tabs-boxed bg-base-200 inline-flex min-w-full sm:min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={clsx('tab whitespace-nowrap', {
              'tab-active font-semibold': activeTab === tab.id,
            })}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
