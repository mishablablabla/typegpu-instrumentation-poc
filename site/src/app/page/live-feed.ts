import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import type { LiveEventRow, LiveResult, LiveScenarioId } from '../live/scenarios';
import { Aside } from '../ui/aside';
import { StatusBadge } from '../ui/status-badge';

const OPTIONS: readonly { id: LiveScenarioId; label: string; note: string }[] = [
  { id: 'broken-shader', label: 'Broken shader', note: 'the same program as the recorded one (raw WGSL)' },
  { id: 'resolve-error', label: 'Resolution error', note: 'plain-WGSL variant: a slot with no value' },
  { id: 'per-frame-churn', label: 'Per-frame churn', note: 'plain-WGSL variant: a pipeline and a buffer per frame' },
];

/** Angular consumer #2: subscribes to a live root in the visitor's browser. The runtime is loaded only on the first run. */
@Component({
  selector: 'app-live-feed',
  imports: [Aside, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-feed.html',
  styleUrl: './live-feed.css',
})
export class LiveFeed implements OnDestroy {
  protected readonly options = OPTIONS;
  protected readonly supported = typeof navigator !== 'undefined' && 'gpu' in navigator;
  protected readonly choice = signal<LiveScenarioId>('per-frame-churn');
  protected readonly running = signal(false);
  protected readonly rows = signal<readonly LiveEventRow[]>([]);
  protected readonly result = signal<LiveResult | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<number | null>(null);
  protected readonly downloadUrl = signal<string | null>(null);
  protected readonly ranId = signal<LiveScenarioId | null>(null);

  protected readonly selectedRow = computed(() => this.rows().find((r) => r.seq === this.selected()) ?? null);
  protected readonly adapterLine = computed(() => {
    const a = this.result()?.adapter;
    if (!a) return null;
    return `${a.vendor} / ${a.architecture} · ${a.isFallbackAdapter ? 'software adapter (fallback)' : 'adapter reports itself as non-fallback; not cross-checked against the browser GPU process'}`;
  });

  protected async run(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    this.rows.set([]);
    this.result.set(null);
    this.error.set(null);
    this.selected.set(null);
    this.revoke();
    const id = this.choice();
    try {
      const { runLive } = await import('../live/scenarios');
      const result = await runLive(id, (row) => this.rows.update((r) => [...r, row]));
      this.result.set(result);
      this.ranId.set(id);
      this.downloadUrl.set(URL.createObjectURL(new Blob([result.jsonl], { type: 'application/x-ndjson' })));
    } catch (caught) {
      this.error.set(`${(caught as Error).name}: ${(caught as Error).message}`);
    } finally {
      this.running.set(false);
    }
  }

  protected pick(seq: number): void {
    this.selected.set(seq);
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  private revoke(): void {
    const url = this.downloadUrl();
    if (url) URL.revokeObjectURL(url);
    this.downloadUrl.set(null);
  }
}
