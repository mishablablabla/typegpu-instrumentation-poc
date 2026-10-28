import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CodeBlock } from '../ui/code-block';

interface Block {
  readonly html: string;
  readonly plain: string;
}

interface Stage {
  readonly id: string;
  readonly title: string;
  readonly sub: string;
  /** What happens to the followed event here. */
  readonly text: string;
  readonly chips?: readonly string[];
}

const STAGES: readonly Stage[] = [
  {
    id: 'app',
    title: 'Your application',
    sub: 'calls TypeGPU as usual',
    text: 'The shader is rejected by WebGPU while this call is waiting.',
  },
  {
    id: 'core',
    title: 'TypeGPU core',
    sub: 'hook sites, always shipped, types only',
    text: 'A guarded call right after the effect it reports. A fault in the layer switches the layer off, never the application, and the error is rethrown unchanged.',
  },
  {
    id: 'hub',
    title: 'Hub',
    sub: 'only bundled when you import the entry',
    text: 'Stamps the event with v, seq and t, keeps it in the history, pins the failure so a late subscriber still finds it, and delivers it to every subscriber in order.',
    chips: ['weak registry', 'bounded history', 'pinned failures', 'one device listener'],
  },
  {
    id: 'contract',
    title: 'Event contract',
    sub: 'plain data: subscribe, history, getSnapshot',
    text: 'The integration boundary. Events are frozen, structuredClone-able data with no TypeGPU or GPU objects (abridged):',
  },
  {
    id: 'consumers',
    title: 'Consumers',
    sub: 'console reporter, JSON Lines, your own',
    text: 'Each consumer needs only the contract. The console reporter prints the same event as one line:',
  },
];

/**
 * The layers a single event passes through, as a stepper: it follows the failed `initAsync` of the debugging example
 * from the call to the console line. Plain HTML and CSS rather than a picture, so the text follows the theme, wraps on
 * a phone and is read by assistive technology. It advances by itself until the reader takes over or pauses it.
 */
@Component({
  selector: 'app-architecture-diagram',
  imports: [CodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './architecture-diagram.html',
  styleUrl: './architecture-diagram.css',
})
export class ArchitectureDiagram {
  readonly call = input.required<Block>();
  readonly hook = input.required<Block>();
  readonly event = input.required<Block>();
  readonly line = input.required<Block>();

  protected readonly stages = STAGES;
  protected readonly active = signal(0);
  protected readonly playing = signal(false);
  protected readonly code = computed(() => [
    this.call(),
    this.hook(),
    null,
    this.event(),
    this.line(),
  ]);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.playing.set(true);
      const timer = setInterval(() => {
        if (this.playing()) this.active.update((i) => (i + 1) % STAGES.length);
      }, 3200);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  /** Picking a stage hands control to the reader. */
  protected select(index: number): void {
    this.playing.set(false);
    this.active.set(index);
  }

  protected toggle(): void {
    this.playing.update((p) => !p);
  }
}
