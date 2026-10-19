import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideCheck,
  LucideChevronLeft,
  LucideChevronRight,
  LucideList,
  LucideLoaderCircle,
  LucidePencil,
  LucidePlay,
  LucidePlus,
  LucideX,
} from '@lucide/angular';
import { ProjectStatus, ProjectRecord } from '../../types/Types';
import { ProjectData } from '../../project-data';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Toast } from '../../toast';


@Component({
  imports: [
    FormsModule, 
    LucideList,
    LucidePlus,
    LucideX,
    LucideChevronLeft,
    LucideChevronRight,
    LucideLoaderCircle,
    LucidePlay,
    LucideCheck,
    LucidePencil,
    DatePipe
  ],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  constructor(private router: Router) {}

  private readonly projectData = inject(ProjectData);
  private readonly toast = inject(Toast);

  // private nextProjectNumber = 0;

  selectedStatus = signal<ProjectStatus>(1);
  readonly pageSize = 10;
  currentPage = signal(1);
  private readonly statusCounts = signal<Record<ProjectStatus, number>>({ 0: 0, 1: 0, 3: 0 });
  private readonly hasNextPage = signal(false);

  inProgress = computed(() => this.statusCounts()[0]);
  newProjects = computed(() => this.statusCounts()[1]);
  completed = computed(() => this.statusCounts()[3]);

  isCreateModalOpen = signal<boolean>(false);

  projectRecords = signal<ProjectRecord[]>([]);

  totalPages = computed(() => Math.max(Math.ceil(this.statusCounts()[this.selectedStatus()] / this.pageSize), 1));
  displayedPage = computed(() => this.currentPage());
  pagedProjects = computed(() => this.projectRecords());

  draftProject: ProjectRecord = this.createEmptyProject();
  editingProjectId = signal<string | null>(null);

  isLoading = signal(true);
  isSaving = signal(false);
  isUpdatingStatus = signal(false);

  ngOnInit(): void {
    this.isLoading.set(true);

    forkJoin({
      inProgress: this.projectData.getProjectsPageByStatus(1, 0),
      newProjects: this.projectData.getProjectsPageByStatus(1, 1),
      completed: this.projectData.getProjectsPageByStatus(1, 3),
    }).subscribe({
      next: (pages) => {
        this.statusCounts.set({
          0: pages.inProgress.totalCount,
          1: pages.newProjects.totalCount,
          3: pages.completed.totalCount,
        });
        const selectedPage = pages.newProjects;
        this.projectRecords.set(selectedPage.projects);
        this.hasNextPage.set(selectedPage.hasNextPage);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toast.error(`Failed to load projects: ${this.getErrorMessage(error)}`);
        this.isLoading.set(false);
        console.error("Failed to load projects: ", error);
      },
    });
  }

  selectStatus(status: ProjectStatus): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadStatusPage(status, 1, true);
  }

  previousPage(): void {
    const page = Math.max(this.currentPage() - 1, 1);
    if (page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadStatusPage(this.selectedStatus(), page);
    }
  }

  nextPage(): void {
    const page = this.currentPage() + 1;
    if (page <= this.totalPages() && this.hasNextPage()) {
      this.currentPage.set(page);
      this.loadStatusPage(this.selectedStatus(), page);
    }
  }

  private loadStatusPage(status: ProjectStatus, page: number, showLoading = false): void {
    if (showLoading) {
      this.isLoading.set(true);
    }

    this.projectData.getProjectsPageByStatus(page, status).subscribe({
      next: (result) => {
        if (status === this.selectedStatus()) {
          this.projectRecords.set(result.projects);
          this.hasNextPage.set(result.hasNextPage);
        }
        this.statusCounts.update((counts) => ({ ...counts, [status]: result.totalCount }));
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toast.error(`Failed to load projects: ${this.getErrorMessage(error)}`);
        this.isLoading.set(false);
        console.error("Failed to load projects: ", error);
      }
    });
  }

  // generateProjectId(): string {
  //   const projectNumber = String(this.nextProjectNumber).padStart(3, '0');
  //   this.nextProjectNumber += 1;

  //   return `SVAM_PROJECT_${projectNumber}`;
  // }

  openCreateModal(): void {
    this.editingProjectId.set(null);
    this.draftProject = this.createEmptyProject();
    this.isCreateModalOpen.set(true);
  }

  openCreateWizard(): void {
    this.router.navigate(['/projects/create']);
  }

  openProjectDetails(projectId: string): void {
    this.router.navigate([`/projects/details/${encodeURIComponent(projectId)}`]);
  }

  editProject(project: ProjectRecord): void {
    this.editingProjectId.set(project.projectId);
    this.draftProject = {
      ...project,
      renewalDate: project.renewalDate ?? this.getToday(),
    };
    this.isCreateModalOpen.set(true);
  }

  saveProject(form: NgForm): void {
    if (form.invalid || !this.hasValidTextFields()) {
      form.control.markAllAsTouched();
      this.toast.error('Please complete all required fields before saving.');
      return;
    }

    this.isSaving.set(true);
    const editingProjectId = this.editingProjectId();

    if (editingProjectId) {

      this.projectData.updateProject(editingProjectId, this.draftProject).subscribe({
        next: (updatedProject) => {
          this.projectRecords.update((projects) => projects.map((project) => project.projectId === editingProjectId ? updatedProject : project));
          this.isCreateModalOpen.set(false);
          this.isSaving.set(false);
          this.toast.inform(`Updated project: ${editingProjectId}`);
        },
        error: (error) => {
          this.toast.error(`Failed to update project: ${this.getErrorMessage(error)}`);
          this.isSaving.set(false);
          console.error("Failed to update project: ", error);
        }
      });
    } else {
      this.projectData.createProject(this.draftProject).subscribe({
        next: (createdProject) => {
          this.projectRecords.update((projects) => [...projects, createdProject]);
          this.isCreateModalOpen.set(false);
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toast.error(`Failed to create project: ${this.getErrorMessage(error)}`);
          this.isSaving.set(false);
          console.error("Failed to create project: ", error);
        }
      })
    }
  }

  changeProjectStatus(projectId: string, status: ProjectStatus): void {
    this.isUpdatingStatus.set(true);

    this.projectData.updateProjectStatus(projectId, status).subscribe({
      next: (updatedProject) => { 
        this.loadStatusPage(this.selectedStatus(), this.currentPage());
        this.isUpdatingStatus.set(false);
        this.toast.inform(`Project status for ${projectId} updated`);
      },
      error: (error) => {
        this.toast.error(`Failed to change status: ${this.getErrorMessage(error)}`);
        this.isUpdatingStatus.set(false);
        console.error("Failed to change status: ", error);
      }
    });
  }

  private createEmptyProject(): ProjectRecord {
    return {
      projectId: 'temp',
      custName: '',
      projectName: '',
      projectStartDate: '',
      projectEndDate: '',
      projectIssueDate: '',
      estimatedHours: 0,
      onshoreManagerName: '',
      offshoreManagerName: '',
      accountManagerName: '',
      status: 1,
    };
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private hasValidTextFields(): boolean {
    return [
      this.draftProject.custName,
      this.draftProject.projectName,
      this.draftProject.projectStartDate,
      this.draftProject.projectEndDate,
      this.draftProject.projectIssueDate,
      this.draftProject.onshoreManagerName,
      this.draftProject.offshoreManagerName,
      this.draftProject.accountManagerName,
    ].every((value) => value.trim().length > 0);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error && typeof error.error.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }

      if (error.error && typeof error.error.detail === 'string' && error.error.detail.trim()) {
        return error.error.detail;
      }

      if (error.error && typeof error.error.title === 'string' && error.error.title.trim()) {
        return error.error.title;
      }

      if (error.error?.errors && typeof error.error.errors === 'object') {
        return Object.values(error.error.errors as Record<string, string[]>)
          .flat()
          .filter(Boolean)
          .join(' ');
      }

      return `Request failed with status ${error.status}.`;
    }

    return error instanceof Error ? error.message : 'An unexpected error occurred.';
  }
}
