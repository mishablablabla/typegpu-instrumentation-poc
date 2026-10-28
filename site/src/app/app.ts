import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NAV, NavState, REPO } from './nav';
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
  protected readonly sections = NAV;
  protected readonly repo = REPO;

  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.nav.menuOpen.set(false);
  }

  protected go(id: string, event: Event): void {
    this.nav.go(id, event);
  }
}
