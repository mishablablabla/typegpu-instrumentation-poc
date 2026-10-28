import { Injectable, signal } from '@angular/core';

export const REPO = 'https://github.com/mishablablabla/typegpu-instrumentation-poc';
export const BRANCH = 'production-readiness';
/** Link to a file of this repository on the branch the page documents. */
export const repoFile = (path: string): string => `${REPO}/blob/${BRANCH}/${path}`;
/** Link to a directory of this repository. */
export const repoDir = (path: string): string => `${REPO}/tree/${BRANCH}/${path}`;

export interface NavItem {
  readonly id: string;
  readonly label: string;
}

/** Sections of the page, in order. */
export const NAV: readonly NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'setup', label: 'Setup' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'options', label: 'Options' },
  { id: 'events', label: 'Reading events' },
  { id: 'output', label: 'Console and JSON Lines' },
  { id: 'cleanup', label: 'Cleanup' },
  { id: 'debugging', label: 'Debugging a failed pipeline' },
];

/** Which section is in view, set by the page, read by the sidebar. */
@Injectable({ providedIn: 'root' })
export class NavState {
  readonly active = signal('overview');
  readonly menuOpen = signal(false);

  /** In-page navigation that works under `<base href="/">` (a bare `#id` link would leave the route). */
  go(id: string, event?: Event): void {
    event?.preventDefault();
    this.menuOpen.set(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    history.replaceState(null, '', `${location.pathname}#${id}`);
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}
