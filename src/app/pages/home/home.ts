import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideList, LucidePlus, LucideX } from '@lucide/angular';

type ProjectStatus = 0 | 1 | 3;

interface ProjectRecord {
  projectId: string;
  custName: string;
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

  status: ProjectStatus;
}

@Component({
  imports: [FormsModule, LucideList, LucidePlus, LucideX],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {

  private nextProjectNumber = 0;

  selectedStatus = signal<ProjectStatus>(1);

  inProgress = computed(() => this.countProjectsByStatus(0));
  newProjects = computed(() => this.countProjectsByStatus(1));
  completed = computed(() => this.countProjectsByStatus(3));

  isCreateModalOpen = signal<boolean>(false);

  projectRecords = signal<ProjectRecord[]>([]);

  filteredProjects = computed(() =>
    this.projectRecords().filter((project) => project.status === this.selectedStatus()),
  );

  draftProject: ProjectRecord = this.createEmptyProject();
  editingProjectId = signal<string | null>(null);

  generateProjectId(): string {
    const projectNumber = String(this.nextProjectNumber).padStart(3, '0');
    this.nextProjectNumber += 1;

    return `SVAM_PROJECT_${projectNumber}`;
  }

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
      this.projectRecords.update((projects) =>
        projects.map((project) =>
          project.projectId === editingProjectId ? { ...this.draftProject } : project,
        ),
      );
    } else {
      this.projectRecords.update((projects) => [...projects, { ...this.draftProject }]);
    }

    this.isCreateModalOpen.set(false);
  }

  changeProjectStatus(projectId: string, status: ProjectStatus): void {
    this.projectRecords.update((projects) =>
      projects.map((project) =>
        project.projectId === projectId ? { ...project, status } : project,
      ),
    );
  }

  private countProjectsByStatus(status: ProjectStatus): number {
    return this.projectRecords().filter((project) => project.status === status).length;
  }

  private createEmptyProject(): ProjectRecord {
    return {
      projectId: this.generateProjectId(),
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
