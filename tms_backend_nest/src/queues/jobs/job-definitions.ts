export interface SendEmailJobData {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

export interface ProcessTaskNotificationJobData {
  taskId: string;
  type: 'created' | 'updated' | 'assigned' | 'status_changed';
  userId: string;
}

export interface GenerateReportJobData {
  projectId: string;
  format: 'pdf' | 'csv' | 'xlsx';
  generatedBy: string;
}

export interface IndexSearchJobData {
  entityType: 'task' | 'project' | 'user';
  entityId: string;
  action: 'index' | 'update' | 'delete';
}

export interface SendWebSocketNotificationJobData {
  userId: string;
  type: string;
  message: string;
  data?: Record<string, any>;
}
