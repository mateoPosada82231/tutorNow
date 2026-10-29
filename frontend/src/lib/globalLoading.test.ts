import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finishNavigation,
  isGlobalLoading,
  resetGlobalLoading,
  startNavigation,
  subscribeToGlobalLoading,
} from './globalLoading';

describe('globalLoading', () => {
  beforeEach(() => {
    resetGlobalLoading();
  });

  it('queda ocupado mientras hay una navegacion en curso', () => {
    startNavigation();

    expect(isGlobalLoading()).toBe(true);

    finishNavigation();

    expect(isGlobalLoading()).toBe(false);
  });

  it('ignora navegaciones duplicadas', () => {
    startNavigation();
    startNavigation();

    finishNavigation();

    expect(isGlobalLoading()).toBe(false);
  });

  it('notifica a los suscriptores cuando cambia el estado', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToGlobalLoading(listener);

    startNavigation();
    expect(listener).toHaveBeenLastCalledWith(true);

    finishNavigation();
    expect(listener).toHaveBeenLastCalledWith(false);

    unsubscribe();
    startNavigation();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
