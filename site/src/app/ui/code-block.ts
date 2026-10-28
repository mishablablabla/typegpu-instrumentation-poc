import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/** A pre-highlighted code block (highlighting happens at build time, see tools/build-data.mjs). */
@Component({
  selector: 'app-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="code-frame">
      @if (title()) {
        <figcaption class="code-title">{{ title() }}</figcaption>
      }
      <div class="code-body">
        <div class="code-scroll" tabindex="0" role="region" [attr.aria-label]="label()" [innerHTML]="trusted()"></div>
        @if (copyText()) {
          <button type="button" class="copy" (click)="copy()" [attr.aria-label]="'Copy ' + label()">
            {{ copied() ? 'Copied' : 'Copy' }}
          </button>
        }
      </div>
    </figure>
  `,
  styleUrl: './code-block.css',
})
export class CodeBlock {
  readonly html = input.required<string>();
  readonly title = input<string>('');
  readonly copyText = input<string>('');
  private readonly sanitizer = inject(DomSanitizer);
  /**
   * The HTML is produced at build time by tools/build-data.mjs (shiki) from the repository's own files, never from user
   * input. Angular's sanitiser would strip the `style="--shiki-light:…"` attributes that carry the token colours.
   */
  protected readonly trusted = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.html()));
  protected readonly label = computed(() => this.title() || 'code sample');
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.copyText());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context or denied): the text stays selectable */
    }
  }
}
