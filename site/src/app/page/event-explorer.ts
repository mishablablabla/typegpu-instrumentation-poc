import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { generated } from '../data/generated';
import { CodeBlock } from '../ui/code-block';

@Component({
  selector: 'app-event-explorer',
  imports: [CodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist" aria-label="Event examples">
      @for (e of examples; track e.name; let i = $index) {
        <button
          type="button"
          role="tab"
          class="tab"
          [id]="'evt-tab-' + i"
          [attr.aria-selected]="active() === i"
          [attr.aria-controls]="'evt-panel'"
          [attr.tabindex]="active() === i ? 0 : -1"
          (click)="active.set(i)"
          (keydown)="onKey($event, i)"
        >
          {{ e.name }}
        </button>
      }
    </div>
    <div id="evt-panel" role="tabpanel" [attr.aria-labelledby]="'evt-tab-' + active()">
      <app-code [html]="current().html" [title]="current().type + ' · seq ' + current().seq + ' · from ' + current().fromFile" />
    </div>
  `,
  styles: `
    :host { display: block; margin-top: 1rem; }
    .tabs { display: flex; flex-wrap: wrap; border-bottom: 2px solid var(--tg-border); }
    .tab { font: inherit; font-size: var(--tg-text-sm); padding: 0.5rem 1rem; border: 0; background: none; cursor: pointer; color: var(--tg-text-muted); margin-bottom: -2px; border-bottom: 2px solid transparent; }
    .tab:hover { color: var(--tg-text-strong); }
    .tab[aria-selected='true'] { color: var(--tg-text-strong); font-weight: 600; border-bottom-color: var(--tg-link); }
    .tab:focus-visible { outline-offset: -3px; }
    app-code { margin-top: 0; }
  `,
})
export class EventExplorer {
  protected readonly examples = generated.eventExamples;
  protected readonly active = signal(0);
  protected readonly current = computed(() => this.examples[this.active()]!);

  protected onKey(event: KeyboardEvent, index: number): void {
    const n = this.examples.length;
    const next =
      event.key === 'ArrowRight' ? (index + 1) % n
      : event.key === 'ArrowLeft' ? (index - 1 + n) % n
      : event.key === 'Home' ? 0
      : event.key === 'End' ? n - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    this.active.set(next);
    queueMicrotask(() => document.getElementById(`evt-tab-${next}`)?.focus());
  }
}
