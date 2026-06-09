import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

/**
 * Authenticated user shape attached by JWT strategy
 */
interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Express request with authenticated user
 */
interface RequestWithUser extends Request {
  user: AuthUser;
}

/**
 * Guard to enforce role-based access control
 * Use with @Roles() decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const user = request.user;

    if (!user?.role) {
      throw new UnauthorizedException('User role not found');
    }

    const hasRole = roles.includes(user.role);

    if (!hasRole) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return true;
  }
}
