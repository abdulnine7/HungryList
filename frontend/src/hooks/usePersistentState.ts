import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export const usePersistentState = <T,>(
  key: string,
  initialValue: T,
  parser?: (raw: string) => T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return initialValue;
    }

    try {
      return parser ? parser(stored) : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
