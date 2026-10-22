import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Create } from './pages/projects/create/create';
import { Details } from './pages/projects/details/details';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'projects',
        children: [
            { path: 'create', component: Create, pathMatch: 'full' },
            { path: 'details/:id', component: Details }
        ]
    },
    {
        path: '**',
        component: NotFound
    }
];
