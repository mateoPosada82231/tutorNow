import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  beginRequest,
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

  it('queda ocupado mientras hay una peticion en curso', () => {
    const release = beginRequest();

    expect(isGlobalLoading()).toBe(true);

    release();

    expect(isGlobalLoading()).toBe(false);
  });

  it('no libera dos veces la misma peticion', () => {
    const first = beginRequest();
    const second = beginRequest();

    first();
    first();

    expect(isGlobalLoading()).toBe(true);

    second();

    expect(isGlobalLoading()).toBe(false);
  });

  it('queda ocupado mientras hay una navegacion en curso', () => {
    startNavigation();

    expect(isGlobalLoading()).toBe(true);

    finishNavigation();

    expect(isGlobalLoading()).toBe(false);
  });

  it('notifica a los suscriptores cuando cambia el estado', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToGlobalLoading(listener);

    const release = beginRequest();
    expect(listener).toHaveBeenLastCalledWith(true);

    release();
    expect(listener).toHaveBeenLastCalledWith(false);

    unsubscribe();
    startNavigation();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
