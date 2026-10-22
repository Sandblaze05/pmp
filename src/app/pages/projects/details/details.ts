import { Component, inject, input, effect } from '@angular/core';
import { ProjectData } from '../../../project-data';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith, catchError, of } from 'rxjs';
import { 
  LucideFolder, 
  LucideUserRound, 
  LucideCalendar,
  LucideUserCog,
  LucideHandshake,
  LucideClock,
  LucideSquareDashedText,
  LucideSearchCheck,
  LucideUserGroup,
  LucideListChecks,
  LucideBicepsFlexed,
  LucideLoaderCircle
} from '@lucide/angular';

@Component({
  imports: [
    LucideFolder, 
    LucideUserRound, 
    LucideCalendar,
    LucideUserCog,
    LucideHandshake,
    LucideClock,
    LucideSquareDashedText,
    LucideSearchCheck,
    LucideUserGroup,
    LucideListChecks,
    LucideBicepsFlexed,
    LucideLoaderCircle
  ],
  selector: 'app-details',
  styleUrl: './details.css',
  templateUrl: './details.html',
})
export class Details {
  constructor() {
    effect(() => {
      console.log(this.projectService);
    })
  }

  private readonly projectService = inject(ProjectData);
  
  readonly id = input.required<string>();

  readonly projectState = toSignal(
    toObservable(this.id).pipe(
      switchMap(currentId => this.projectService.getProject(currentId).pipe(
        map((project) => ({
          project,
          loading: false,
          error: false
        })),
        startWith({
          project: null,
          loading: true,
          error: false
        }),
        catchError(() => of({
          project: null,
          loading: false,
          error: true
        }))
      ))
    ),
    { initialValue: { project: null, loading: true, error: false } }
  );
}
