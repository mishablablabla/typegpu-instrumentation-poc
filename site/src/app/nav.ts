import { Injectable, signal } from '@angular/core';

export const REPO = 'https://github.com/mishablablabla/typegpu-instrumentation-poc';
export const BRANCH = 'production-readiness';
/** Link to a file of this repository on the branch the page documents. */
export const repoFile = (path: string): string => `${REPO}/blob/${BRANCH}/${path}`;

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly badge?: string;
}
export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

/** Sections of the page, grouped the way the official docs group their sidebar. */
export const NAV: readonly NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'What it is' },
      { id: 'status', label: 'Status and verdict' },
      { id: 'problem', label: 'The debugging problem' },
    ],
  },
  {
    label: 'See it',
    items: [
      { id: 'scenarios', label: 'Scenario explorer', badge: 'recorded' },
      { id: 'live', label: 'Live event feed', badge: 'prototype' },
    ],
  },
  {
    label: 'How it works',
    items: [
      { id: 'architecture', label: 'Architecture' },
      { id: 'quick-start', label: 'Quick start' },
      { id: 'events', label: 'Event contract' },
      { id: 'consumers', label: 'Core versus UI' },
    ],
  },
  {
    label: 'Evidence',
    items: [
      { id: 'gap', label: 'Is there a gap?' },
      { id: 'performance', label: 'Performance and compatibility' },
      { id: 'limits', label: 'Limitations' },
    ],
  },
  {
    label: 'Next',
    items: [
      { id: 'roadmap', label: 'Roadmap' },
      { id: 'references', label: 'References' },
    ],
  },
];

export const DOCS: readonly { label: string; path: string }[] = [
  { label: 'Event contract', path: 'docs/EVENT-CONTRACT.md' },
  { label: 'Architecture decision', path: 'docs/ARCHITECTURE-DECISION.md' },
  { label: 'Ecosystem research', path: 'docs/ECOSYSTEM-RESEARCH.md' },
  { label: 'Performance', path: 'docs/PERFORMANCE.md' },
  { label: 'Production readiness', path: 'docs/PRODUCTION-READINESS.md' },
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
