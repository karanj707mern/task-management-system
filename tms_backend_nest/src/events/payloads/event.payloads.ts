export class UserCreatedPayload {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class UserUpdatedPayload {
  id: string;
  email?: string;
  name?: string;
  updatedAt: Date;
}

export class TaskCreatedPayload {
  id: string;
  title: string;
  projectId: string;
  assigneeEmail?: string;
  assigneeName?: string;
  projectName?: string;
  createdAt: Date;
}

export class TaskUpdatedPayload {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  assigneeEmail?: string;
  assigneeName?: string;
  projectName?: string;
  updatedAt: Date;
}

export class TaskStatusChangedPayload {
  id: string;
  title: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  assigneeEmail?: string;
  assigneeName?: string;
  projectName?: string;
  changedAt: Date;
}

export class CommentCreatedPayload {
  id: string;
  taskId: string;
  taskTitle?: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export class ProjectCreatedPayload {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}