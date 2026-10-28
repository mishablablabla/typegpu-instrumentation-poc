import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DOCS, NAV, NavState, REPO, repoFile } from './nav';
import { ThemeService } from './theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly nav = inject(NavState);
  protected readonly themeService = inject(ThemeService);
  protected readonly groups = NAV;
  protected readonly docs = DOCS;
  protected readonly repo = REPO;
  protected readonly repoFile = repoFile;

  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.nav.menuOpen.set(false);
  }

  protected go(id: string, event: Event): void {
    this.nav.go(id, event);
  }
}
