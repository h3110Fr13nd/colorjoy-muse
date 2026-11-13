import { useCallback, useEffect, useState } from 'react';

const SAME_TAB_EVENT = 'colorjoy:local-storage';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

/**
 * useState that persists to localStorage, so UI preferences survive reloads and new tabs.
 * Every hook instance using the same key stays in sync (same tab and other tabs).
 */
export const useLocalStorageState = <T,>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => read(key, defaultValue));

  useEffect(() => {
    const sync = (e: Event) => {
      const changedKey = e instanceof StorageEvent ? e.key : (e as CustomEvent<string>).detail;
      if (changedKey === key) setValue(read(key, defaultValue));
    };
    window.addEventListener('storage', sync);
    window.addEventListener(SAME_TAB_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(SAME_TAB_EVENT, sync);
    };
    // defaultValue intentionally omitted: only the key identifies the stored value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(read(key, defaultValue)) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage full/disabled: the preference just won't persist.
      }
      setValue(resolved);
      window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: key }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  const toggle = useCallback(() => update(prev => !prev as T), [update]);

  return [value, update, toggle] as const;
};
