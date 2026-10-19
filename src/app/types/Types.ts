import { Observable } from "rxjs";

export type ProjectStatus = 0 | 1 | 3;
export type ApiProjectStatus = 'InProgress' | 'PendingApproval' | 'Completed';
export type ToastType = 'error' | 'warning' | 'info';
export type ProjectSector = 'Automobile' | 'Business' | 'Education' | 'Digital Media' | 'Default';

export interface ProjectWizardDetails {
  customerAddress: string;
  projectSector: string;
  clientContactName: string;
  clientEmail: string;
  clientPmName: string;
  clientPmEmail: string;
  projectDescription: string;
  scope: string;
  managedBy: string;
  domain: string;
  type: string;
  totalValue: number | null;
  methodology: string;
  technology: string;
  lead: string;
  stakeholders: string;
}

export interface ProjectTask {
  name: string;
  description: string;
}

export interface ProjectEffort {
  person: string;
  taskName: string;
  estimatedHours: number;
}

export interface ProjectRecord {
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
  wizardDetails?: ProjectWizardDetails;
  tasks?: ProjectTask[];
  efforts?: ProjectEffort[];

  status: ProjectStatus;
}

export interface ApiProjectResponse extends Omit<ProjectRecord, 'custName' | 'status'> {
  customerName: string;
  status: ApiProjectStatus;
}

export interface ApiProjectListResponse {
  items: ApiProjectResponse[];
  hasNextPage: boolean;
  totalCount: number;
}

export interface ProjectPage {
  projects: ProjectRecord[];
  hasNextPage: boolean;
  totalCount: number;
}

export interface ProjectRequest {
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
  wizardDetails: ProjectWizardDetails;
  tasks: ProjectTask[];
  efforts: ProjectEffort[];
}

export interface UpdateProjectStatusRequest {
  status: ApiProjectStatus;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface WizardTask {
  id: number;
  name: string;
  description: string;
}

export interface WizardEffort {
  id: number;
  taskId: number | null;
  person: string;
  estimatedHours: number;
}

export interface WizardDetails {
  customerAddress: string;
  projectSector: ProjectSector;
  clientContactName: string;
  clientEmail: string;
  clientPmName: string;
  clientPmEmail: string;
  projectDescription: string;
  scope: string;
  managedBy: string;
  domain: string;
  type: string;
  totalValue: number | null;
  methodology: string;
  technology: string;
  lead: string;
  stakeholders: string;
}

export interface CacheEntry {
  expiresAt: number;
  value: Observable<unknown>;
}