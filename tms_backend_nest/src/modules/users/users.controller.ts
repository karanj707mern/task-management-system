import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';
import { UsersQueryDto } from '@/common/dto/pagination-query.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';

import { CreateManualUserDto } from './dto/user.dto';
import { UpdateUserDto, UpdateRoleDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser('userId') id: string, @GetUser('role') role: UserRole) {
    return this.usersService.findById(id, id, role);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@GetUser('userId') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(id, dto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('admin')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminRoute() {
    return {
      message: 'Admin endpoint available',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser('userId') requesterId: string, @GetUser('role') requesterRole: UserRole) {
    return this.usersService.findById(id, requesterId, requesterRole);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@GetUser('role') creatorRole: UserRole, @Body() dto: CreateManualUserDto) {
    return this.usersService.createManualUser(dto, creatorRole);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@GetUser('role') updaterRole: UserRole, @Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto, updaterRole);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateRole(@GetUser('role') updaterRole: UserRole, @Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.update(id, { role: dto.role }, updaterRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(
    @GetUser('role') requesterRole: UserRole,
    @GetUser('userId') requesterId: string,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.usersService.remove(id, requesterRole, requesterId);
  }
}
