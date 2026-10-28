import { ChangeDetectionStrategy, DestroyRef, Component, ElementRef, afterNextRender, inject } from '@angular/core';
import { NAV, NavState, repoFile } from '../nav';
import { generated } from '../data/generated';
import { SCENARIOS } from '../data/scenario-content';
import {
  EVENT_MEANINGS,
  INTEGRATIONS,
  LIMITATIONS,
  PERF_ROWS,
  REFERENCES,
  ROADMAP,
  STATUS_FACTS,
  VERDICTS,
} from '../data/facts';
import { Aside } from '../ui/aside';
import { CodeBlock } from '../ui/code-block';
import { StatusBadge } from '../ui/status-badge';
import { ArchitectureDiagram } from './architecture-diagram';
import { LiveFeed } from './live-feed';
import { EventExplorer } from './event-explorer';
import { ScenarioExplorer } from './scenario-explorer';

@Component({
  selector: 'app-instrumentation-page',
  imports: [Aside, CodeBlock, StatusBadge, ArchitectureDiagram, EventExplorer, LiveFeed, ScenarioExplorer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instrumentation-page.html',
  styleUrl: './instrumentation-page.css',
})
export class InstrumentationPage {
  private readonly nav = inject(NavState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly statusFacts = STATUS_FACTS;
  protected readonly verdicts = VERDICTS;
  protected readonly perfRows = PERF_ROWS;
  protected readonly integrations = INTEGRATIONS;
  protected readonly eventMeanings = EVENT_MEANINGS;
  protected readonly limitations = LIMITATIONS;
  protected readonly roadmap = ROADMAP;
  protected readonly references = REFERENCES;
  protected readonly quickstartHtml = generated.quickstartHtml;
  protected readonly quickstartPlain = generated.quickstartPlain;
  protected readonly setupHtml = generated.setupHtml;
  protected readonly setupPlain = generated.setupPlain;
  protected readonly churn = generated.scenarios['per-frame-churn'];
  protected readonly broken = generated.scenarios['broken-shader'];
  protected readonly resolveErr = generated.scenarios['resolve-error'];
  protected readonly info = SCENARIOS;
  protected readonly failedCreate = generated.eventExamples.find((e) => e.name === 'pipeline-creation-failed (create)')!;
  protected readonly failedResolve = generated.eventExamples.find((e) => e.name === 'pipeline-creation-failed (resolve)')!;
  protected readonly diagnostics = generated.eventExamples.find((e) => e.name === 'shader-diagnostics')!;
  protected readonly repoFile = repoFile;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const ids = NAV.flatMap((g) => g.items.map((i) => i.id));
      const sections = ids
        .map((id) => this.host.nativeElement.querySelector<HTMLElement>(`#${id}`))
        .filter((el): el is HTMLElement => el !== null);
      const update = () => {
        const line = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-nav-h')) * 16 + 96;
        let current = sections[0]?.id ?? 'overview';
        for (const el of sections) {
          if (el.getBoundingClientRect().top <= line) current = el.id;
        }
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        this.nav.active.set(atBottom ? (sections.at(-1)?.id ?? current) : current);
      };
      // about a dozen getBoundingClientRect calls per scroll event: cheap enough to run unthrottled, and it does not
      // depend on requestAnimationFrame (which a backgrounded tab suspends)
      const onScroll = update;
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
      const hash = location.hash.slice(1);
      if (hash) setTimeout(() => this.nav.go(hash));
    });
  }

  protected jump(id: string, event: Event): void {
    this.nav.go(id, event);
  }
}
