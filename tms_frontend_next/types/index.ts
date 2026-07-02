export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';

export const ROLE_LEVELS: Record<UserRole, number> = {
  VIEWER: 0,
  EMPLOYEE: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasRoleAccess(userRole: UserRole | undefined, requiredRoles: UserRole[]) {
  if (!userRole) return false;
  const userLevel = ROLE_LEVELS[userRole] ?? -1;
  return requiredRoles.some((requiredRole) => {
    const requiredLevel = ROLE_LEVELS[requiredRole] ?? -1;
    return userLevel >= requiredLevel;
  });
}

export function isAdministrator(userRole: UserRole | undefined) {
  return hasRoleAccess(userRole, ['ADMIN']);
}

export function isManagerOrAbove(userRole: UserRole | undefined) {
  return hasRoleAccess(userRole, ['MANAGER']);
}

export function isEmployeeOrAbove(userRole: UserRole | undefined) {
  return hasRoleAccess(userRole, ['EMPLOYEE']);
}

export function isGuest(userRole: UserRole | undefined) {
  return userRole === 'VIEWER';
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export const TeamMemberRole = {
  LEAD: 'LEAD',
  MEMBER: 'MEMBER',
} as const;

export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];

export interface Epic {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: EpicStatus;
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Pick<Project, 'id' | 'name'>;
  creator?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  tasks?: Task[];
  sprints?: Sprint[];
  _count?: {
    tasks: number;
    sprints: number;
  };
}

export type EpicStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  projectId: string;
  epicId?: string;
  startDate?: Date;
  endDate?: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Pick<Project, 'id' | 'name'>;
  epic?: Pick<Epic, 'id' | 'name'>;
  creator?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  tasks?: Task[];
  _count?: { tasks: number };
}

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  githubRepoId?: string;
  githubRepoUrl?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  projectId: string;
  assigneeId: string;
  createdById: string;
  parentTaskId?: string;
  epicId?: string;
  sprintId?: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  project?: Pick<Project, 'id' | 'name'>;
  epic?: Pick<Epic, 'id' | 'name' | 'color'>;
  sprint?: Pick<Sprint, 'id' | 'name'>;
  parentTask?: Pick<Task, 'id' | 'title'>;
  subTasks?: Task[];
  workLogs?: WorkLog[];
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  department?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamMemberRole;
  joinedAt: Date;
  user?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestAccess {
  id: string;
  email: string;
  name: string;
  department?: string;
  jobTitle?: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type PRStatus = 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'MERGED' | 'CLOSED' | 'DRAFT';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';

export interface CodeReview {
  id: string;
  prId: string;
  reviewerId: string;
  status: ReviewStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  pullRequest: {
    id: string;
    title: string;
    authorId: string;
  };
  reviewer: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface PullRequest {
  id: string;
  title: string;
  description?: string;
  taskId: string;
  sourceBranch: string;
  targetBranch: string;
  status: PRStatus;
  isDraft: boolean;
  authorId: string;
  reviewerId?: string;
  mergedAt?: Date;
  mergedById?: string;
  githubPrId?: string;
  githubRepoId?: string;
  createdAt: Date;
  updatedAt: Date;
  task?: Pick<Task, 'id' | 'title'>;
  author?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  reviewer?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  mergedBy?: Pick<User, 'id' | 'email' | 'name'>;
  reviews?: CodeReview[];
  commits?: Commit[];
  reviewers?: ReviewerOnPR[];
  _count?: { reviews: number };
}

export interface ReviewerOnPR {
  id: string;
  prId: string;
  reviewerId: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewer: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface Branch {
  id: string;
  name: string;
  taskId: string;
  sprintId?: string;
  authorId: string;
  createdAt: Date;
  author?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface Commit {
  id: string;
  message: string;
  branchId: string;
  authorId: string;
  taskId?: string;
  prId?: string;
  sha: string;
  createdAt: Date;
  author?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
