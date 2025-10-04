import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DeviceListComponent } from './pages/devicelist/devicelist.component';

export const routes: Routes = [{
    path: '',
    component: LayoutComponent,
    children: [
        { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
        { path: 'dashboard', component: DashboardComponent },
        { path: 'devices', component: DeviceListComponent }
    ],
},];

