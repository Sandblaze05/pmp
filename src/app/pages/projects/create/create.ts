import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectData } from '../../../project-data';
import {
  ProjectRecord,
  WizardDetails,
  WizardEffort,
  WizardTask,
} from '../../../types/Types';
import { LucideChevronRight } from '@lucide/angular';
import { Toast } from '../../../toast';

const SECTORS = ["Automobile", "Business", "Education", "Digital Media", "Default"] as const;

@Component({
  imports: [FormsModule, LucideChevronRight],
  selector: 'app-create',
  styleUrl: './create.css',
  templateUrl: './create.html',
})
export class Create {
  private readonly sectors = SECTORS;
  private readonly toast = inject(Toast);
  private readonly projectData = inject(ProjectData);
  private readonly router = inject(Router);

  readonly currentStep = signal(1);
  readonly totalSteps = 4;
  readonly isSaving = signal(false);
  readonly validationErrorMessage = signal<string | null>(null);
  readonly saveErrorMessage = signal<string | null>(null);
  readonly taskDialogOpen = signal(false);
  readonly effortDialogOpen = signal(false);

  draftProject: ProjectRecord = this.createEmptyProject();
  wizardDetails: WizardDetails = this.createEmptyWizardDetails();
  tasks: WizardTask[] = [];
  efforts: WizardEffort[] = [];
  taskDraft = this.createEmptyTask();
  effortDraft = this.createEmptyEffort();
  editingTaskId: number | null = null;
  editingEffortId: number | null = null;
  private nextItemId = 1;

  nextStep(form: NgForm): void {
    if (!this.isCurrentStepValid(form)) {
      form.control.markAllAsTouched();
      this.validationErrorMessage.set('Please complete all required fields before continuing.');
      return;
    }

    this.validationErrorMessage.set(null);
    this.currentStep.update((step) => Math.min(step + 1, this.totalSteps + 1));
  }

  previousStep(): void {
    this.validationErrorMessage.set(null);
    this.currentStep.update((step) => Math.max(step - 1, 1));
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.validationErrorMessage.set(null);
      this.currentStep.set(step);
    }
  }

  addTask(): void {
    this.editingTaskId = null;
    this.taskDraft = this.createEmptyTask();
    this.taskDialogOpen.set(true);
  }

  editTask(task: WizardTask): void {
    this.editingTaskId = task.id;
    this.taskDraft = { ...task };
    this.taskDialogOpen.set(true);
  }

  saveTask(): void {
    const name = this.taskDraft.name.trim();
    const description = this.taskDraft.description.trim();
    if (!name || !description) return;

    if (this.editingTaskId === null) {
      this.tasks.push({ ...this.taskDraft, id: this.nextItemId++, name, description });
    } else {
      this.tasks = this.tasks.map((task) => task.id === this.editingTaskId ? { ...task, name, description } : task);
    }
    this.taskDialogOpen.set(false);
    this.editingTaskId = null;
  }

  cancelTaskDialog(): void {
    this.taskDialogOpen.set(false);
    this.editingTaskId = null;
  }

  removeTask(index: number): void {
    const [removedTask] = this.tasks.splice(index, 1);
    if (removedTask) {
      this.efforts = this.efforts.filter((effort) => effort.taskId !== removedTask.id);
    }
  }

  addEffort(): void {
    this.editingEffortId = null;
    this.effortDraft = this.createEmptyEffort();
    this.effortDialogOpen.set(true);
  }

  editEffort(effort: WizardEffort): void {
    this.editingEffortId = effort.id;
    this.effortDraft = { ...effort };
    this.effortDialogOpen.set(true);
  }

  saveEffort(): void {
    if (this.effortDraft.taskId === null || !this.effortDraft.person.trim() || Number(this.effortDraft.estimatedHours) <= 0) return;

    const effort = { ...this.effortDraft, id: this.editingEffortId ?? this.nextItemId++, person: this.effortDraft.person.trim() };
    if (this.editingEffortId === null) {
      this.efforts.push(effort);
    } else {
      this.efforts = this.efforts.map((item) => item.id === this.editingEffortId ? effort : item);
    }
    this.effortDialogOpen.set(false);
    this.editingEffortId = null;
  }

  cancelEffortDialog(): void {
    this.effortDialogOpen.set(false);
    this.editingEffortId = null;
  }

  taskName(taskId: number | null): string {
    return this.tasks.find((task) => task.id === taskId)?.name ?? 'Task removed';
  }

  removeEffort(index: number): void {
    this.efforts.splice(index, 1);
  }

  totalEstimatedEffort(): number {
    return this.efforts.reduce((total, effort) => total + (Number(effort.estimatedHours) || 0), 0);
  }

  saveProject(form: NgForm): void {
    if (!this.isCurrentStepValid(form)) {
      form.control.markAllAsTouched();
      this.validationErrorMessage.set('Please complete all required fields before creating the project.');
      return;
    }

    this.validationErrorMessage.set(null);
    this.saveErrorMessage.set(null);
    this.isSaving.set(true);

    const projectToSave: ProjectRecord = {
      ...this.draftProject,
      wizardDetails: this.wizardDetails,
      tasks: this.tasks.map(({ name, description }) => ({ name, description })),
      efforts: this.efforts.map((effort) => ({
        person: effort.person,
        taskName: this.taskName(effort.taskId),
        estimatedHours: Number(effort.estimatedHours),
      })),
    };

    this.projectData.createProject(projectToSave).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.inform("Project created.");
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.saveErrorMessage.set(`Failed to create project: ${this.getErrorMessage(error)}`);
        this.isSaving.set(false);
        console.error('Failed to create project:', error);
      },
    });
  }

  cancel(): void {
    this.toast.inform("Cancelled creation.");
    void this.router.navigate(['/']);
  }

  private isCurrentStepValid(form: NgForm): boolean {
    if (this.currentStep() === 1) {
      return form.valid === true && this.wizardDetails.projectSector !== "Default" && [
        this.draftProject.custName,
        this.wizardDetails.customerAddress,
        this.wizardDetails.projectSector,
      ].every((value) => value.trim().length > 0);
    }

    if (this.currentStep() === 2) {
      return form.valid === true && [
        this.draftProject.projectName,
        this.wizardDetails.projectDescription,
        this.wizardDetails.scope,
        this.wizardDetails.managedBy,
        this.wizardDetails.domain,
        this.wizardDetails.type,
        this.wizardDetails.methodology,
        this.draftProject.projectStartDate,
        this.draftProject.projectEndDate,
        this.draftProject.onshoreManagerName,
        this.draftProject.offshoreManagerName,
        this.draftProject.accountManagerName,
      ].every((value) => value.trim().length > 0)
        && Number(this.draftProject.estimatedHours) >= 0;
    }

    return true;
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

  private createEmptyWizardDetails(): WizardDetails {
    return {
      customerAddress: '',
      projectSector: 'Default',
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

  private createEmptyTask(): WizardTask {
    return { id: 0, name: '', description: '' };
  }

  private createEmptyEffort(): WizardEffort {
    return { id: 0, taskId: null, person: '', estimatedHours: 0 };
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
