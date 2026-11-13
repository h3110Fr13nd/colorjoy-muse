import { useLocalStorageState } from './useLocalStorageState';

/** Shared "Show/Hide Tips" preference for every page. */
export const useTipsVisibility = () => {
  const [visible, , toggle] = useLocalStorageState('colorjoy:show-tips', true);
  return { visible, toggle };
};
