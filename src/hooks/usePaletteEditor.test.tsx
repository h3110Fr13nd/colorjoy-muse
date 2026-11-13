import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toPaletteColors } from '@/lib/palette';
import { GENERATE_ANIMATION_MS, usePaletteEditor } from './usePaletteEditor';

const setup = (hexes = ['#111111', '#222222', '#333333']) =>
  renderHook(() => usePaletteEditor(() => toPaletteColors(hexes)));

const generate = (result: { current: ReturnType<typeof usePaletteEditor> }) => {
  act(() => result.current.generate());
  act(() => vi.advanceTimersByTime(GENERATE_ANIMATION_MS));
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('usePaletteEditor', () => {
  it('toggling a lock never changes the palette (regression: lock used to regenerate)', () => {
    const { result } = setup();
    const before = result.current.hexes;
    act(() => result.current.toggleLock(result.current.colors[1].id));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.hexes).toEqual(before);
    expect(result.current.colors[1].locked).toBe(true);
  });

  it('generate replaces unlocked colors and keeps locked ones', () => {
    const { result } = setup();
    const lockedId = result.current.colors[0].id;
    act(() => result.current.toggleLock(lockedId));
    const before = result.current.hexes;
    generate(result);
    expect(result.current.hexes[0]).toBe(before[0]);
    expect(result.current.hexes.slice(1)).not.toEqual(before.slice(1));
  });

  it('respects a lock toggled during the generate animation', () => {
    const { result } = setup();
    const before = result.current.hexes;
    act(() => result.current.generate());
    act(() => result.current.toggleLock(result.current.colors[2].id));
    act(() => vi.advanceTimersByTime(GENERATE_ANIMATION_MS));
    expect(result.current.hexes[2]).toBe(before[2]);
  });

  it('normalizes manual edits and keeps ids stable', () => {
    const { result } = setup();
    const id = result.current.colors[0].id;
    act(() => result.current.updateColor(id, 'abc'));
    expect(result.current.colors[0]).toMatchObject({ id, hex: '#AABBCC' });
  });

  it('adds and removes colors, but never removes the last one', () => {
    const { result } = setup(['#111111']);
    act(() => result.current.addColor(1));
    expect(result.current.colors).toHaveLength(2);

    let removed = false;
    act(() => {
      removed = result.current.removeColor(result.current.colors[1].id);
    });
    expect(removed).toBe(true);
    act(() => {
      removed = result.current.removeColor(result.current.colors[0].id);
    });
    expect(removed).toBe(false);
    expect(result.current.colors).toHaveLength(1);
  });

  it('marks image-picked colors as adjusted after a manual edit', () => {
    const { result } = setup(['#111111']);
    const id = result.current.colors[0].id;
    act(() => result.current.pickColor(id, '#FF0000', { x: 0.5, y: 0.5 }));
    expect(result.current.colors[0]).toMatchObject({ hex: '#FF0000', adjusted: false, source: { x: 0.5, y: 0.5 } });
    act(() => result.current.updateColor(id, '#00FF00'));
    expect(result.current.colors[0]).toMatchObject({ hex: '#00FF00', adjusted: true });
  });
});
