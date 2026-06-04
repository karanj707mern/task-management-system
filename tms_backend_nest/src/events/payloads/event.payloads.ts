/**
 * Event payloads/data contracts
 */

export class UserCreatedPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export class UserUpdatedPayload {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  updatedAt: Date;
}

export class TaskCreatedPayload {
  id: string;
  title: string;
  projectId: string;
  assignedTo?: string;
  createdAt: Date;
}

export class TaskUpdatedPayload {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  updatedAt: Date;
}

export class TaskStatusChangedPayload {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedAt: Date;
  changedBy: string;
}

export class CommentCreatedPayload {
  id: string;
  taskId: string;
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
