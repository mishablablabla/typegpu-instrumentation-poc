import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The four honesty levels used for every integration and claim on the page. */
export type Status = 'verified' | 'prototype' | 'proposed' | 'unverified';

const LABEL: Record<Status, string> = {
  verified: 'Implemented and verified',
  prototype: 'Prototype',
  proposed: 'Proposed',
  unverified: 'Not verified',
};

@Component({
  selector: 'app-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"badge badge-" + status()' },
  template: `<span class="dot" aria-hidden="true"></span>{{ text() }}`,
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  readonly status = input.required<Status>();
  readonly label = input<string>('');
  protected text(): string {
    return this.label() || LABEL[this.status()];
  }
}
