import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export function assertRole(userRole: UserRole, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}

export function isAdministrator(userRole: UserRole) {
  return userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN;
}

export function isManagerOrAbove(userRole: UserRole) {
  return isAdministrator(userRole) || userRole === UserRole.MANAGER;
}
