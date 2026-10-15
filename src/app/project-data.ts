import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ProjectRecord, ProjectStatus } from './types/Types';
import { environment } from '../environments/environment';

type ApiProjectStatus = 'InProgress' | 'PendingApproval' | 'Completed';

interface ApiProjectResponse extends Omit<ProjectRecord, 'custName' | 'status'> {
  customerName: string;
  status: ApiProjectStatus;
}

interface ProjectRequest {
  customerName: string;
  projectName: string;
  projectStartDate: string;
  projectEndDate: string;
  revisedEndDate?: string;
  renewalDate?: string;
  projectIssueDate: string;
  estimatedHours: number;
  actualHours?: number;
  onshoreManagerName: string;
  offshoreManagerName: string;
  accountManagerName: string;
}

interface UpdateProjectStatusRequest {
  status: ApiProjectStatus;
}

@Injectable({ providedIn: 'root' })
export class ProjectData {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.projectApiUrl;

  getProjects(): Observable<ProjectRecord[]> {
    return this.http
      .get<ApiProjectResponse[]>(this.apiUrl)
      .pipe(map((projects) => projects.map((project) => this.fromResponse(project))));
  }

  getProject(projectId: string): Observable<ProjectRecord> {
    return this.http
      .get<ApiProjectResponse>(`${this.apiUrl}/${projectId}`)
      .pipe(map((project) => this.fromResponse(project)));
  }

  createProject(project: ProjectRecord): Observable<ProjectRecord> {
    return this.http
      .post<ApiProjectResponse>(this.apiUrl, this.toRequest(project))
      .pipe(map((createdProject) => this.fromResponse(createdProject)));
  }

  updateProject(projectId: string, project: ProjectRecord): Observable<ProjectRecord> {
    return this.http
      .put<ApiProjectResponse>(`${this.apiUrl}/${projectId}`, this.toRequest(project))
      .pipe(map((updatedProject) => this.fromResponse(updatedProject)));
  }

  updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
  ): Observable<ProjectRecord> {
    const request: UpdateProjectStatusRequest = { status: this.toApiStatus(status) };
    return this.http
      .patch<ApiProjectResponse>(`${this.apiUrl}/${projectId}`, request)
      .pipe(map((updatedProject) => this.fromResponse(updatedProject)));
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
    };
  }

  private fromResponse(project: ApiProjectResponse): ProjectRecord {
    return {
      ...project,
      custName: project.customerName,
      status: this.fromApiStatus(project.status),
    };
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
}
