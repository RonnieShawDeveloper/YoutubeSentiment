import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

export const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // Protected routes (to be implemented)
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'report/:id',
    loadComponent: () => import('./report/report.component').then(c => c.ReportComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'analyze',
    loadComponent: () => import('./analyze/analyze.component').then(c => c.AnalyzeComponent),
    canActivate: [AuthGuard]
  },

  // Fallback route
  { path: '**', redirectTo: '/login' }
];
