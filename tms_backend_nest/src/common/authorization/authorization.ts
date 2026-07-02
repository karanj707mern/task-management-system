import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.VIEWER]: 0,
  [UserRole.EMPLOYEE]: 1,
  [UserRole.MANAGER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

export function assertRole(userRole: UserRole, allowedRoles: UserRole[]) {
  if (!hasRoleAccess(userRole, allowedRoles)) {
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}

export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]) {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  return requiredRoles.some((requiredRole) => {
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? -1;
    return userLevel >= requiredLevel;
  });
}

export function isAdministrator(userRole: UserRole) {
  return hasRoleAccess(userRole, [UserRole.ADMIN]);
}

export function isManagerOrAbove(userRole: UserRole) {
  return hasRoleAccess(userRole, [UserRole.MANAGER]);
}

export function isEmployeeOrAbove(userRole: UserRole) {
  return hasRoleAccess(userRole, [UserRole.EMPLOYEE]);
}

export function isGuest(userRole: UserRole) {
  return userRole === UserRole.VIEWER;
}

export function canDeleteResource(userRole: UserRole) {
  return hasRoleAccess(userRole, [UserRole.ADMIN]);
}

export function canArchiveResource(userRole: UserRole) {
  return hasRoleAccess(userRole, [UserRole.MANAGER]);
}

export function assertTaskOwnershipOrAdmin(requesterId: string, taskAssigneeId: string, userRole: UserRole) {
  if (isAdministrator(userRole) || requesterId === taskAssigneeId) {
    return;
  }
  throw new ForbiddenException('You can only update tasks assigned to you');
}
