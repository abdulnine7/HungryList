import clsx from 'clsx';

import type { Section } from '../lib/types';

export const SectionChips = ({
  sections,
  selected,
  onSelect,
}: {
  sections: Section[];
  selected: string | 'all';
  onSelect: (sectionId: string | 'all') => void;
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={clsx('btn btn-sm rounded-full', { 'btn-primary': selected === 'all', 'btn-ghost': selected !== 'all' })}
        onClick={() => onSelect('all')}
      >
        All Sections
      </button>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={clsx('btn btn-sm rounded-full', {
            'btn-primary': selected === section.id,
            'btn-ghost': selected !== section.id,
          })}
          onClick={() => onSelect(section.id)}
          style={selected === section.id ? undefined : { borderColor: section.color }}
        >
          <span aria-hidden="true">{section.icon}</span>
          {section.name}
        </button>
      ))}
    </div>
  );
};
