import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { generated } from '../data/generated';
import { SCENARIOS, SCENARIO_ORDER, type ScenarioId } from '../data/scenario-content';
import { CodeBlock } from '../ui/code-block';
import { StatusBadge } from '../ui/status-badge';

interface Row {
  readonly seq: number | null;
  readonly text: string;
  readonly kind: 'event' | 'note' | 'summary';
}

@Component({
  selector: 'app-scenario-explorer',
  imports: [CodeBlock, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scenario-explorer.html',
  styleUrl: './scenario-explorer.css',
})
export class ScenarioExplorer {
  protected readonly order = SCENARIO_ORDER;
  protected readonly meta = SCENARIOS;
  protected readonly active = signal<ScenarioId>('broken-shader');
  protected readonly selectedSeq = signal<number | null>(null);

  protected readonly data = computed(() => generated.scenarios[this.active()]);
  protected readonly info = computed(() => SCENARIOS[this.active()]);

  protected readonly rows = computed<Row[]>(() =>
    this.data().trace.map((text) => {
      const m = /^\[(\d{3})\] (.*)$/.exec(text);
      if (m) return { seq: Number(m[1]), text: m[2] ?? '', kind: 'event' as const };
      const isNote = text.startsWith('[scenario]') || text.startsWith('[browser warning]');
      return { seq: null, text, kind: isNote ? ('note' as const) : ('summary' as const) };
    }),
  );

  protected readonly selected = computed(() => {
    const seq = this.selectedSeq();
    return seq === null ? null : (this.data().events.find((e) => e.seq === seq) ?? null);
  });

  protected select(id: ScenarioId): void {
    this.active.set(id);
    this.selectedSeq.set(null);
  }

  protected pick(seq: number | null): void {
    if (seq !== null) this.selectedSeq.set(seq);
  }

  protected onTabKey(event: KeyboardEvent, index: number): void {
    const last = this.order.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index + 1) % this.order.length
      : event.key === 'ArrowLeft' ? (index - 1 + this.order.length) % this.order.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    const id = this.order[next]!;
    this.select(id);
    queueMicrotask(() => document.getElementById(`tab-${id}`)?.focus());
  }

  protected shortDate(iso: string): string {
    return iso.slice(0, 10);
  }
}
