type LoadingListener = (busy: boolean) => void;

let navigating = false;

const listeners = new Set<LoadingListener>();

function notify(): void {
  listeners.forEach((listener) => listener(navigating));
}

export function isGlobalLoading(): boolean {
  return navigating;
}

export function subscribeToGlobalLoading(listener: LoadingListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function startNavigation(): void {
  if (navigating) return;
  navigating = true;
  notify();
}

export function finishNavigation(): void {
  if (!navigating) return;
  navigating = false;
  notify();
}

export function resetGlobalLoading(): void {
  navigating = false;
  notify();
}
