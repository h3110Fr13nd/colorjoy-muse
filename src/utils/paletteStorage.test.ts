import { beforeEach, describe, expect, it, vi } from 'vitest';

// The store caches in module state, so each test gets a fresh module.
const loadModule = async () => {
  vi.resetModules();
  return import('./paletteStorage');
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('paletteStore (saved palettes)', () => {
  it('adds, renames, edits and deletes palettes, persisting to localStorage', async () => {
    const { paletteStore, SAVED_PALETTES_STORAGE_KEY } = await loadModule();
    const listener = vi.fn();
    paletteStore.subscribe(listener);

    const saved = paletteStore.add('Ocean', ['#112233', '#445566']);
    expect(paletteStore.getSnapshot()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(SAVED_PALETTES_STORAGE_KEY)!)[0].name).toBe('Ocean');

    paletteStore.update(saved.id, { name: 'Deep Ocean', colors: ['#000000'] });
    expect(paletteStore.getSnapshot()[0]).toMatchObject({ name: 'Deep Ocean', colors: ['#000000'] });

    paletteStore.remove(saved.id);
    expect(paletteStore.getSnapshot()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('returns a stable snapshot between changes (required by useSyncExternalStore)', async () => {
    const { paletteStore } = await loadModule();
    expect(paletteStore.getSnapshot()).toBe(paletteStore.getSnapshot());
  });

  it('ignores corrupted or invalid stored data', async () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('colorjoy:saved-palettes', '{not json');
    expect((await loadModule()).paletteStore.getSnapshot()).toEqual([]);
    expect(logError).toHaveBeenCalled();

    localStorage.setItem(
      'colorjoy:saved-palettes',
      JSON.stringify([{ id: 'a', name: 'ok', colors: ['#abc'] }, { id: 'b', name: 'bad', colors: ['nope'] }, 42])
    );
    const palettes = (await loadModule()).paletteStore.getSnapshot();
    expect(palettes).toHaveLength(1);
    expect(palettes[0].colors).toEqual(['#AABBCC']);
  });
});

describe('working palette (session)', () => {
  it('round-trips colors, locks and image points', async () => {
    const { createWorkingPaletteStorage } = await loadModule();
    const storage = createWorkingPaletteStorage('test:working');
    storage.save([{ hex: '#AABBCC', locked: true, source: { x: 0.1, y: 0.2 }, adjusted: false }], 'img-1');
    expect(storage.load()).toEqual({
      colors: [{ hex: '#AABBCC', locked: true, source: { x: 0.1, y: 0.2 }, adjusted: false }],
      imageId: 'img-1',
    });
  });

  it('reads the older array format', async () => {
    const { createWorkingPaletteStorage } = await loadModule();
    sessionStorage.setItem('test:legacy', JSON.stringify([{ hex: '#ff0000', locked: false }]));
    expect(createWorkingPaletteStorage('test:legacy').load()?.colors).toEqual([{ hex: '#FF0000', locked: false }]);
  });
});
