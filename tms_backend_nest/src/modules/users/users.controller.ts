import { Controller, Get, UseGuards } from '@nestjs/common';

import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: AuthUser) {
    return user;
  }

  @Get('admin')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminRoute() {
    return {
      message: 'Welcome Admin',
    };
  }
}
