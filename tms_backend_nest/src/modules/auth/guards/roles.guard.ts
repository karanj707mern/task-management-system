import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { UserRole } from '@prisma/client';

import { hasRoleAccess } from '../../../common/authorization/authorization';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: AuthUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRole = request.user?.role as UserRole | undefined;

    if (!userRole) {
      return false;
    }

    return hasRoleAccess(userRole, requiredRoles as UserRole[]);
  }
}
