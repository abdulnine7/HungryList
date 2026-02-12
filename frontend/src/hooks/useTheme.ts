import { useEffect } from 'react';

import { usePersistentState } from './usePersistentState';

export type AppTheme = 'hungryLight' | 'hungryDark';

export const useTheme = () => {
  const [theme, setTheme] = usePersistentState<AppTheme>('hungrylist.theme', 'hungryLight');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === 'hungryLight' ? 'hungryDark' : 'hungryLight')),
  };
};
