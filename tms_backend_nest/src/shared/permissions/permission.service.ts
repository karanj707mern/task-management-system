import { ForbiddenException, Injectable } from '@nestjs/common';

export enum Permission {
  CREATE_PROJECT = 'create:project',
  READ_PROJECT = 'read:project',
  UPDATE_PROJECT = 'update:project',
  DELETE_PROJECT = 'delete:project',

  CREATE_TASK = 'create:task',
  READ_TASK = 'read:task',
  UPDATE_TASK = 'update:task',
  DELETE_TASK = 'delete:task',

  CREATE_COMMENT = 'create:comment',
  READ_COMMENT = 'read:comment',
  UPDATE_COMMENT = 'update:comment',
  DELETE_COMMENT = 'delete:comment',

  MANAGE_TEAM = 'manage:team',
  MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles',
}

export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.CREATE_COMMENT,
    Permission.READ_COMMENT,
    Permission.UPDATE_COMMENT,
    Permission.DELETE_COMMENT,
    Permission.MANAGE_TEAM,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
  ],
  EMPLOYEE: [
    Permission.READ_PROJECT,
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.CREATE_COMMENT,
    Permission.READ_COMMENT,
    Permission.UPDATE_COMMENT,
  ],
};

@Injectable()
export class PermissionService {
  hasPermission(userRole: string, requiredPermission: Permission): boolean {
    const permissions = RolePermissions[userRole] || [];
    return permissions.includes(requiredPermission);
  }

  checkPermission(userRole: string, requiredPermission: Permission): void {
    if (!this.hasPermission(userRole, requiredPermission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  hasAnyPermission(
    userRole: string,
    requiredPermissions: Permission[],
  ): boolean {
    return requiredPermissions.some((permission) =>
      this.hasPermission(userRole, permission),
    );
  }

  hasAllPermissions(
    userRole: string,
    requiredPermissions: Permission[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      this.hasPermission(userRole, permission),
    );
  }
}
