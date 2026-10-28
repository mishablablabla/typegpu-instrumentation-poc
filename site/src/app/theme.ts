import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const KEY = 'tg-instrumentation-theme';

/** `data-theme` on <html>, persisted; follows the system when nothing is stored (docs behaviour: light if the system is light, else dark). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    this.apply(this.theme());
  }

  set(theme: Theme): void {
    document.documentElement.classList.add('no-transition');
    this.theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage blocked: the choice lasts for this visit only */
    }
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('no-transition')));
  }

  private initial(): Theme {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      /* ignore */
    }
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private apply(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme;
  }
}
