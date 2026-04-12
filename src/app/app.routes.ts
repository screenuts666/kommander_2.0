import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./setup/setup.page').then((m) => m.SetupPage),
    pathMatch: 'full'
  },
  {
    path: 'board',
    loadComponent: () => import('./board/board.page').then((m) => m.BoardPage),
  }
];
