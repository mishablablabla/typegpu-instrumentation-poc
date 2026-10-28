import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'instrumentation' },
  {
    path: 'instrumentation',
    title: 'TypeGPU Instrumentation (PoC)',
    loadComponent: () => import('./page/instrumentation-page').then((m) => m.InstrumentationPage),
  },
  { path: '**', redirectTo: 'instrumentation' },
];
