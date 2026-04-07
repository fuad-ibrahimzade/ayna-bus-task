import { Routes } from '@angular/router';
import { DemographicsComponent } from './demographics/demographics';
import { BusAnalyticsComponent } from './bus-analytics/bus-analytics';
import { LiveRoutesComponent } from './live-routes/live-routes';

export const routes: Routes = [
  { path: '', redirectTo: 'demographics', pathMatch: 'full' },
  { path: 'demographics', component: DemographicsComponent },
  { path: 'bus-analytics', component: BusAnalyticsComponent },
  { path: 'live-routes', component: LiveRoutesComponent },
];
