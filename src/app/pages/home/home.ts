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

  // private nextProjectNumber = 0;

  selectedStatus = signal<ProjectStatus>(1);
  readonly pageSize = 10;
  currentPage = signal(1);

  inProgress = computed(() => this.countProjectsByStatus(0));
  newProjects = computed(() => this.countProjectsByStatus(1));
  completed = computed(() => this.countProjectsByStatus(3));

  isCreateModalOpen = signal<boolean>(false);

  projectRecords = signal<ProjectRecord[]>([]);

  filteredProjects = computed(() =>
    this.projectRecords().filter((project) => project.status === this.selectedStatus()),
  );
  totalPages = computed(() => Math.ceil(this.filteredProjects().length / this.pageSize));
  displayedPage = computed(() => Math.min(this.currentPage(), Math.max(this.totalPages(), 1)));
  pagedProjects = computed(() => {
    const start = (this.displayedPage() - 1) * this.pageSize;
    return this.filteredProjects().slice(start, start + this.pageSize);
  });

  draftProject: ProjectRecord = this.createEmptyProject();
  editingProjectId = signal<string | null>(null);

  isLoading = signal(true);
  isSaving = signal(false);
  isUpdatingStatus = signal(false);

  loadErrorMessage = signal<string | null>(null);
  validationErrorMessage = signal<string | null>(null);
  saveErrorMessage = signal<string | null>(null);
  statusErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    this.projectData.getProjects().subscribe({
      next: (projects) => {
        this.projectRecords.set(projects);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loadErrorMessage.set(`Failed to load projects: ${this.getErrorMessage(error)}`);
        this.isLoading.set(false);
        console.error("Failed to load projects: ", error);
      }
    });
  }

  selectStatus(status: ProjectStatus): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  previousPage(): void {
    this.currentPage.update((page) => Math.max(page - 1, 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(page + 1, this.totalPages()));
  }

  // generateProjectId(): string {
  //   const projectNumber = String(this.nextProjectNumber).padStart(3, '0');
  //   this.nextProjectNumber += 1;

  //   return `SVAM_PROJECT_${projectNumber}`;
  // }

  openCreateModal(): void {
    this.editingProjectId.set(null);
    this.draftProject = this.createEmptyProject();
    this.validationErrorMessage.set(null);
    this.saveErrorMessage.set(null);
    this.isCreateModalOpen.set(true);
  }

  openCreateWizard(): void {
    this.router.navigate(['/projects/create']);
  }

  editProject(project: ProjectRecord): void {
    this.editingProjectId.set(project.projectId);
    this.draftProject = {
      ...project,
      renewalDate: project.renewalDate ?? this.getToday(),
    };
    this.validationErrorMessage.set(null);
    this.saveErrorMessage.set(null);
    this.isCreateModalOpen.set(true);
  }

  saveProject(form: NgForm): void {
    if (form.invalid || !this.hasValidTextFields()) {
      form.control.markAllAsTouched();
      this.validationErrorMessage.set('Please complete all required fields before saving.');
      return;
    }

    this.validationErrorMessage.set(null);
    this.saveErrorMessage.set(null);
    this.isSaving.set(true);
    const editingProjectId = this.editingProjectId();

    if (editingProjectId) {

      this.projectData.updateProject(editingProjectId, this.draftProject).subscribe({
        next: (updatedProject) => {
          this.projectRecords.update((projects) => projects.map((project) => project.projectId === editingProjectId ? updatedProject : project));
          this.isCreateModalOpen.set(false);
          this.isSaving.set(false);
        },
        error: (error) => {
          this.saveErrorMessage.set(`Failed to update project: ${this.getErrorMessage(error)}`);
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
          this.saveErrorMessage.set(`Failed to create project: ${this.getErrorMessage(error)}`);
          this.isSaving.set(false);
          console.error("Failed to create project: ", error);
        }
      })
    }
  }

  changeProjectStatus(projectId: string, status: ProjectStatus): void {
    this.isUpdatingStatus.set(true);
    this.statusErrorMessage.set(null);

    this.projectData.updateProjectStatus(projectId, status).subscribe({
      next: (updatedProject) => { 
        this.projectRecords.update((projects) => projects.map((project) => project.projectId === projectId ? updatedProject : project));
        this.isUpdatingStatus.set(false);
      },
      error: (error) => {
        this.statusErrorMessage.set(`Failed to change status: ${this.getErrorMessage(error)}`);
        this.isUpdatingStatus.set(false);
        console.error("Failed to change status: ", error);
      }
    });
  }

  private countProjectsByStatus(status: ProjectStatus): number {
    return this.projectRecords().filter((project) => project.status === status).length;
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

      return `Request failed with status ${error.status}.`;
    }

    return error instanceof Error ? error.message : 'An unexpected error occurred.';
  }
}
