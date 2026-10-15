import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideList, LucidePlus, LucideX, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ProjectStatus, ProjectRecord } from '../../types/Types';
import { ProjectData } from '../../project-data';


@Component({
  imports: [FormsModule, LucideList, LucidePlus, LucideX, DatePipe, LucideChevronLeft, LucideChevronRight],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {

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

  ngOnInit(): void {
    this.projectData.getProjects().subscribe({
      next: (projects) => {
        this.projectRecords.set(projects);
      },
      error: (error) => {
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
    this.isCreateModalOpen.set(true);
  }

  editProject(project: ProjectRecord): void {
    this.editingProjectId.set(project.projectId);
    this.draftProject = {
      ...project,
      renewalDate: project.renewalDate ?? this.getToday(),
    };
    this.isCreateModalOpen.set(true);
  }

  saveProject(): void {
    const editingProjectId = this.editingProjectId();

    if (editingProjectId) {
      this.projectData.updateProject(editingProjectId, this.draftProject).subscribe({
        next: (updatedProject) => {
          this.projectRecords.update((projects) => projects.map((project) => project.projectId === editingProjectId ? updatedProject : project));
          this.isCreateModalOpen.set(false);
        },
        error: (error) => {
          console.error("Failed to update project: ", error);
        }
      });
    } else {
      this.projectData.createProject(this.draftProject).subscribe({
        next: (createdProject) => {
          this.projectRecords.update((projects) => [...projects, createdProject]);
          this.isCreateModalOpen.set(false);
        },
        error: (error) => {
          console.error("Failed to create project: ", error);
        }
      })
    }

    this.isCreateModalOpen.set(false);
  }

  changeProjectStatus(projectId: string, status: ProjectStatus): void {
    this.projectData.updateProjectStatus(projectId, status).subscribe({
      next: (updatedProject) => { 
        this.projectRecords.update((projects) => projects.map((project) => project.projectId === projectId ? updatedProject : project));
      },
      error: (error) => {
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
}
