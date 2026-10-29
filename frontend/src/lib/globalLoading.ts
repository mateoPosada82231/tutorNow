type LoadingListener = (busy: boolean) => void;

let pendingRequests = 0;
let navigating = false;

const listeners = new Set<LoadingListener>();

function isBusy(): boolean {
  return pendingRequests > 0 || navigating;
}

function notify(): void {
  const busy = isBusy();
  listeners.forEach((listener) => listener(busy));
}

export function isGlobalLoading(): boolean {
  return isBusy();
}

export function subscribeToGlobalLoading(listener: LoadingListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function beginRequest(): () => void {
  pendingRequests += 1;
  notify();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    pendingRequests = Math.max(0, pendingRequests - 1);
    notify();
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
  pendingRequests = 0;
  navigating = false;
  notify();
}
