export type ProjectStatus = 0 | 1 | 3;

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

  status: ProjectStatus;
}