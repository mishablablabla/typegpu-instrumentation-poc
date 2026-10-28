import {
  ChangeDetectionStrategy,
  DestroyRef,
  Component,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { NAV, NavState, repoDir } from '../nav';
import { generated } from '../data/generated';
import { Aside } from '../ui/aside';
import { CodeBlock } from '../ui/code-block';
import { ArchitectureDiagram } from './architecture-diagram';

@Component({
  selector: 'app-instrumentation-page',
  imports: [Aside, CodeBlock, ArchitectureDiagram],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instrumentation-page.html',
  styleUrl: './instrumentation-page.css',
})
export class InstrumentationPage {
  private readonly nav = inject(NavState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly code = generated;
  protected readonly repoDir = repoDir;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const sections = NAV.map((item) =>
        this.host.nativeElement.querySelector<HTMLElement>(`#${item.id}`),
      ).filter((el): el is HTMLElement => el !== null);
      const update = () => {
        const line =
          parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-nav-h')) *
            16 +
          96;
        let current = sections[0]?.id ?? 'overview';
        for (const el of sections) {
          if (el.getBoundingClientRect().top <= line) current = el.id;
        }
        const atBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        this.nav.active.set(atBottom ? (sections.at(-1)?.id ?? current) : current);
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
      destroyRef.onDestroy(() => window.removeEventListener('scroll', update));
      const hash = location.hash.slice(1);
      if (hash) setTimeout(() => this.nav.go(hash));
    });
  }

  protected jump(id: string, event: Event): void {
    this.nav.go(id, event);
  }
}
