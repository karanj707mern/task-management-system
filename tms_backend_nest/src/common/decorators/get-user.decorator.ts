import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthUser {
  id: string;
  userId: string;
  email: string;
  role: string;
}

export const GetUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      user: AuthUser;
    }>();

    const user = request.user;

    return data ? user[data] : user;
  },
);
