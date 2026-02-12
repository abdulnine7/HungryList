import { Moon, Sun } from 'lucide-react';

import type { AppTheme } from '../hooks/useTheme';

export const ThemeToggle = ({
  theme,
  onToggle,
}: {
  theme: AppTheme;
  onToggle: () => void;
}) => {
  const isDark = theme === 'hungryDark';

  return (
    <button
      type="button"
      className="btn btn-circle btn-ghost"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
