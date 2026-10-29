'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { finishNavigation, startNavigation } from '@/lib/globalLoading';

const SHOW_DELAY_MS = 1000;
const MIN_VISIBLE_MS = 350;
const NAVIGATION_TIMEOUT_MS = 10000;

function isInternalNavigationClick(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const target = event.target as Element | null;
  const anchor = target?.closest?.('a');
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || /^(mailto|tel):/i.test(href)) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const busy = useGlobalLoading();
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (busy) {
      if (visible) return;
      const timeout = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
      return () => clearTimeout(timeout);
    }

    if (!visible) return;
    const elapsed = Date.now() - shownAt.current;
    const timeout = setTimeout(() => setVisible(false), Math.max(0, MIN_VISIBLE_MS - elapsed));
    return () => clearTimeout(timeout);
  }, [busy, visible]);

  useEffect(() => {
    finishNavigation();
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!isInternalNavigationClick(event)) return;
      startNavigation();
      window.setTimeout(finishNavigation, NAVIGATION_TIMEOUT_MS);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return (
    <>
      {children}
      <span role="status" aria-live="polite" className="sr-only">
        {busy ? 'Cargando, por favor espera' : ''}
      </span>
      <LoadingOverlay visible={visible} />
    </>
  );
}
