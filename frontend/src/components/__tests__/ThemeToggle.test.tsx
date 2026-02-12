import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();

    render(<ThemeToggle theme="hungryLight" onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
