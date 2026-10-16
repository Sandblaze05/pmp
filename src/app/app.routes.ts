import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Create } from './pages/projects/create/create';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'projects',
        children: [
            { path: 'create', component: Create, pathMatch: 'full' }
        ]
    }
];
