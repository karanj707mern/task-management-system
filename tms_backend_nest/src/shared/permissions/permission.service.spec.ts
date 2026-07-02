import { UserRole } from '@prisma/client';

import { Permission, PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    service = new PermissionService();
  });

  it('restricts user management to administrators and above', () => {
    expect(service.hasPermission(UserRole.MANAGER, Permission.MANAGE_USERS)).toBe(false);
    expect(service.hasPermission(UserRole.ADMIN, Permission.MANAGE_USERS)).toBe(true);
    expect(service.hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_USERS)).toBe(true);
  });

  it('keeps role management restricted to admin and above', () => {
    expect(service.hasPermission(UserRole.MANAGER, Permission.MANAGE_ROLES)).toBe(false);
    expect(service.hasPermission(UserRole.ADMIN, Permission.MANAGE_ROLES)).toBe(true);
    expect(service.hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_ROLES)).toBe(true);
  });

  it('enforces delete permissions for administrators only', () => {
    expect(service.hasPermission(UserRole.MANAGER, Permission.DELETE_TASK)).toBe(false);
    expect(service.hasPermission(UserRole.ADMIN, Permission.DELETE_TASK)).toBe(true);
    expect(service.hasPermission(UserRole.SUPER_ADMIN, Permission.DELETE_TASK)).toBe(true);
  });

  it('allows managers and above to archive tasks', () => {
    expect(service.hasPermission(UserRole.MANAGER, Permission.ARCHIVE_TASK)).toBe(true);
    expect(service.hasPermission(UserRole.ADMIN, Permission.ARCHIVE_TASK)).toBe(true);
    expect(service.hasPermission(UserRole.EMPLOYEE, Permission.ARCHIVE_TASK)).toBe(false);
    expect(service.hasPermission(UserRole.VIEWER, Permission.ARCHIVE_TASK)).toBe(false);
  });

  it('allows guests to read and comment but not create tasks', () => {
    expect(service.hasPermission(UserRole.VIEWER, Permission.READ_TASK)).toBe(true);
    expect(service.hasPermission(UserRole.VIEWER, Permission.CREATE_COMMENT)).toBe(true);
    expect(service.hasPermission(UserRole.VIEWER, Permission.CREATE_TASK)).toBe(false);
    expect(service.hasPermission(UserRole.VIEWER, Permission.DELETE_TASK)).toBe(false);
  });
});
