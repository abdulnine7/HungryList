import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ItemFilters, defaultFilters } from '../ItemFilters';

describe('ItemFilters', () => {
  it('triggers onChange when toggles are updated', () => {
    const onChange = vi.fn();

    render(<ItemFilters filters={defaultFilters} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText(/favorites only/i));

    expect(onChange).toHaveBeenCalled();
  });
});
