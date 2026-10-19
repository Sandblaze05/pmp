import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { 
  map, 
  Observable,
  catchError,
  shareReplay,
  tap,
  throwError
} from 'rxjs';
import {
  ApiProjectListResponse,
  ApiProjectResponse,
  ApiProjectStatus,
  ProjectEffort,
  ProjectPage,
  ProjectRecord,
  ProjectRequest,
  ProjectStatus,
  ProjectTask,
  ProjectWizardDetails,
  UpdateProjectStatusRequest,
  CacheEntry
} from './types/Types';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectData {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.projectApiUrl;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtl = 5 * 60 * 1000;

  private cacheRead<T>(
    key: string,
    request: () => Observable<T>
  ): Observable<T> {
    const existing = this.cache.get(key);

    if (existing && existing.expiresAt > Date.now()) {
      return existing.value as Observable<T>;
    }

    this.cache.delete(key);

    const value = request().pipe(
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(key, {
      expiresAt: Date.now() + this.cacheTtl,
      value,
    });

    return value;
  }

  private invalidateProjectCache(projectId?: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('projects:list:')) {
        this.cache.delete(key);
      }
    }

    if (projectId) {
      this.cache.delete(`projects:detail:${projectId}`);
    }
  }

  getProjects(): Observable<ProjectRecord[]> {
    return this.getProjectsPage(1).pipe(map((page) => page.projects));
  }

  getProjectsPage(page: number): Observable<ProjectPage> {
    return this.getProjectsPageByStatus(page);
  }

  getProjectsPageByStatus(page: number, status?: ProjectStatus): Observable<ProjectPage> {
    const statusKey = status === undefined ? 'all' : String(status);
    const key = `projects:list:${page}:${statusKey}`;

    return this.cacheRead(key, () => {
      let params = new HttpParams().set('page', page);

      if (status !== undefined) {
        params = params.set('status', this.toApiStatus(status));
      }

      return this.http
        .get<ApiProjectListResponse>(this.apiUrl, { params })
        .pipe(
          map((response) => ({
            projects: response.items.map((project) => this.fromResponse(project)),
            hasNextPage: response.hasNextPage,
            totalCount: response.totalCount,
          })),
        );
    });
  }

  getProject(projectId: string): Observable<ProjectRecord> {
    return this.cacheRead(`projects:detail:${projectId}`, () => 
      this.http
        .get<ApiProjectResponse>(`${this.apiUrl}/${projectId}`)
        .pipe(map((project) => this.fromResponse(project)))
    ); 
  }

  createProject(project: ProjectRecord): Observable<ProjectRecord> {
    return this.http
      .post<ApiProjectResponse>(this.apiUrl, this.toRequest(project))
      .pipe(
        map((createdProject) => this.fromResponse(createdProject)),
        tap(() => this.invalidateProjectCache())
    );
  }

  updateProject(projectId: string, project: ProjectRecord): Observable<ProjectRecord> {
    return this.http
      .put<ApiProjectResponse>(`${this.apiUrl}/${projectId}`, this.toRequest(project))
      .pipe(
        map((updatedProject) => this.fromResponse(updatedProject)),
        tap(() => this.invalidateProjectCache(projectId))
      );
  }

  updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
  ): Observable<ProjectRecord> {
    const request: UpdateProjectStatusRequest = { status: this.toApiStatus(status) };
    return this.http
      .patch<ApiProjectResponse>(`${this.apiUrl}/${projectId}`, request)
      .pipe(
        map((updatedProject) => this.fromResponse(updatedProject)),
        tap(() => this.invalidateProjectCache(projectId))
      );
  }

  private toRequest(project: ProjectRecord): ProjectRequest {
    return {
      customerName: project.custName,
      projectName: project.projectName,
      projectStartDate: project.projectStartDate,
      projectEndDate: project.projectEndDate,
      revisedEndDate: project.revisedEndDate,
      renewalDate: project.renewalDate,
      projectIssueDate: project.projectIssueDate,
      estimatedHours: project.estimatedHours,
      actualHours: project.actualHours,
      onshoreManagerName: project.onshoreManagerName,
      offshoreManagerName: project.offshoreManagerName,
      accountManagerName: project.accountManagerName,
      wizardDetails: project.wizardDetails ?? this.emptyWizardDetails(),
      tasks: project.tasks ?? [],
      efforts: project.efforts ?? [],
    };
  }

  private fromResponse(project: ApiProjectResponse): ProjectRecord {
    return {
      ...project,
      custName: project.customerName,
      projectStartDate: this.toDateInputValue(project.projectStartDate) ?? '',
      projectEndDate: this.toDateInputValue(project.projectEndDate) ?? '',
      revisedEndDate: this.toDateInputValue(project.revisedEndDate),
      renewalDate: this.toDateInputValue(project.renewalDate),
      projectIssueDate: this.toDateInputValue(project.projectIssueDate) ?? '',
      status: this.fromApiStatus(project.status),
    };
  }

  private toDateInputValue(value: string | undefined): string | undefined {
    return value?.slice(0, 10);
  }

  private toApiStatus(status: ProjectStatus): ApiProjectStatus {
    switch (status) {
      case 0:
        return 'InProgress';
      case 1:
        return 'PendingApproval';
      case 3:
        return 'Completed';
    }
  }

  private fromApiStatus(status: ApiProjectStatus): ProjectStatus {
    switch (status) {
      case 'InProgress':
        return 0;
      case 'PendingApproval':
        return 1;
      case 'Completed':
        return 3;
    }
  }

  private emptyWizardDetails(): ProjectWizardDetails {
    return {
      customerAddress: '',
      projectSector: '',
      clientContactName: '',
      clientEmail: '',
      clientPmName: '',
      clientPmEmail: '',
      projectDescription: '',
      scope: '',
      managedBy: '',
      domain: '',
      type: '',
      totalValue: null,
      methodology: '',
      technology: '',
      lead: '',
      stakeholders: '',
    };
  }
}
