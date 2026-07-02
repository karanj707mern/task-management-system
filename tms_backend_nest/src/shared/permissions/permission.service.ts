import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export enum Permission {
  READ_USER = 'read:user',
  MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles',

  CREATE_PROJECT = 'create:project',
  READ_PROJECT = 'read:project',
  UPDATE_PROJECT = 'update:project',
  DELETE_PROJECT = 'delete:project',
  ARCHIVE_PROJECT = 'archive:project',

  CREATE_TASK = 'create:task',
  READ_TASK = 'read:task',
  UPDATE_TASK = 'update:task',
  DELETE_TASK = 'delete:task',
  ARCHIVE_TASK = 'archive:task',

  CREATE_EPIC = 'create:epic',
  READ_EPIC = 'read:epic',
  UPDATE_EPIC = 'update:epic',
  DELETE_EPIC = 'delete:epic',
  ARCHIVE_EPIC = 'archive:epic',

  CREATE_SPRINT = 'create:sprint',
  READ_SPRINT = 'read:sprint',
  UPDATE_SPRINT = 'update:sprint',
  DELETE_SPRINT = 'delete:sprint',
  ARCHIVE_SPRINT = 'archive:sprint',

  CREATE_BRANCH = 'create:branch',
  READ_BRANCH = 'read:branch',
  UPDATE_BRANCH = 'update:branch',
  DELETE_BRANCH = 'delete:branch',

  CREATE_COMMIT = 'create:commit',
  READ_COMMIT = 'read:commit',
  DELETE_COMMIT = 'delete:commit',

  CREATE_PULL_REQUEST = 'create:pull_request',
  READ_PULL_REQUEST = 'read:pull_request',
  UPDATE_PULL_REQUEST = 'update:pull_request',
  DELETE_PULL_REQUEST = 'delete:pull_request',
  MERGE_PULL_REQUEST = 'merge:pull_request',

  CREATE_CODE_REVIEW = 'create:code_review',
  READ_CODE_REVIEW = 'read:code_review',
  UPDATE_CODE_REVIEW = 'update:code_review',
  DELETE_CODE_REVIEW = 'delete:code_review',

  READ_TEAM = 'read:team',
  MANAGE_TEAM = 'manage:team',

  CREATE_COMMENT = 'create:comment',
  READ_COMMENT = 'read:comment',
  UPDATE_COMMENT = 'update:comment',
  DELETE_COMMENT = 'delete:comment',

  CREATE_ATTACHMENT = 'create:attachment',
  READ_ATTACHMENT = 'read:attachment',
  DELETE_ATTACHMENT = 'delete:attachment',
}

const viewerPermissions: Permission[] = [
  Permission.READ_PROJECT,
  Permission.READ_TASK,
  Permission.READ_EPIC,
  Permission.READ_SPRINT,
  Permission.READ_BRANCH,
  Permission.READ_COMMIT,
  Permission.READ_PULL_REQUEST,
  Permission.READ_CODE_REVIEW,
  Permission.READ_TEAM,
  Permission.READ_COMMENT,
  Permission.READ_ATTACHMENT,
  Permission.CREATE_COMMENT,
  Permission.CREATE_ATTACHMENT,
  Permission.UPDATE_COMMENT,
  Permission.DELETE_COMMENT,
];

const employeePermissions: Permission[] = [
  ...viewerPermissions,
  Permission.READ_USER,
  Permission.UPDATE_TASK,
];

const managerPermissions: Permission[] = [
  ...employeePermissions,
  Permission.CREATE_PROJECT,
  Permission.UPDATE_PROJECT,
  Permission.ARCHIVE_PROJECT,
  Permission.CREATE_TASK,
  Permission.ARCHIVE_TASK,
  Permission.CREATE_EPIC,
  Permission.UPDATE_EPIC,
  Permission.ARCHIVE_EPIC,
  Permission.CREATE_SPRINT,
  Permission.UPDATE_SPRINT,
  Permission.ARCHIVE_SPRINT,
  Permission.CREATE_BRANCH,
  Permission.UPDATE_BRANCH,
  Permission.CREATE_COMMIT,
  Permission.CREATE_PULL_REQUEST,
  Permission.UPDATE_PULL_REQUEST,
  Permission.MERGE_PULL_REQUEST,
  Permission.CREATE_CODE_REVIEW,
  Permission.UPDATE_CODE_REVIEW,
  Permission.MANAGE_TEAM,
];

const adminPermissions: Permission[] = [
  ...managerPermissions,
  Permission.DELETE_PROJECT,
  Permission.DELETE_TASK,
  Permission.DELETE_EPIC,
  Permission.DELETE_SPRINT,
  Permission.DELETE_BRANCH,
  Permission.DELETE_COMMIT,
  Permission.DELETE_PULL_REQUEST,
  Permission.DELETE_CODE_REVIEW,
  Permission.DELETE_ATTACHMENT,
  Permission.MANAGE_USERS,
  Permission.MANAGE_ROLES,
];

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: viewerPermissions,
  [UserRole.EMPLOYEE]: employeePermissions,
  [UserRole.MANAGER]: managerPermissions,
  [UserRole.ADMIN]: adminPermissions,
  [UserRole.SUPER_ADMIN]: adminPermissions,
};

@Injectable()
export class PermissionService {
  hasPermission(userRole: UserRole | string, requiredPermission: Permission): boolean {
    const normalizedRole = (typeof userRole === 'string' ? userRole.toUpperCase() : userRole) as UserRole;
    const permissions = RolePermissions[normalizedRole] || [];
    return permissions.includes(requiredPermission);
  }

  checkPermission(userRole: UserRole | string, requiredPermission: Permission): void {
    if (!this.hasPermission(userRole, requiredPermission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  hasAnyPermission(userRole: UserRole | string, requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some((permission) => this.hasPermission(userRole, permission));
  }

  hasAllPermissions(userRole: UserRole | string, requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every((permission) => this.hasPermission(userRole, permission));
  }
}
