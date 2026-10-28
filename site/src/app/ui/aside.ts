import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AsideKind = 'note' | 'tip' | 'caution' | 'danger';

@Component({
  selector: 'app-aside',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"aside aside-" + kind()', role: 'note' },
  template: `
    <p class="aside-title">{{ title() || defaultTitle() }}</p>
    <div class="aside-body"><ng-content /></div>
  `,
  styleUrl: './aside.css',
})
export class Aside {
  readonly kind = input<AsideKind>('note');
  readonly title = input<string>('');
  protected defaultTitle(): string {
    return { note: 'Note', tip: 'Tip', caution: 'Caution', danger: 'Danger' }[this.kind()];
  }
}
