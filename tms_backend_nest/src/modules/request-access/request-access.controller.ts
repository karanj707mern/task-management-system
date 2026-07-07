import { Controller, Get, Param, Patch, Post, Body, UseGuards, Query } from '@nestjs/common';
import { RequestAccessService } from './request-access.service';
import { CreateRequestAccessDto } from './dto/create-request-access.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { IPaginationQuery } from '@/common/types/common.types';

@Controller('request-access')
export class RequestAccessController {
  constructor(private readonly requestAccessService: RequestAccessService) {}

  @Post()
  create(@Body() dto: CreateRequestAccessDto) {
    return this.requestAccessService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  findAll(
    @Query() query: IPaginationQuery & { status?: string; search?: string },
    @GetUser('role') role: UserRole,
  ) {
    return this.requestAccessService.findAll(query, role);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  findPending(@Query() query: IPaginationQuery, @GetUser('role') role: UserRole) {
    return this.requestAccessService.findPending(query, role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser('role') role: UserRole) {
    return this.requestAccessService.findOne(id, role);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  approve(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') reviewerId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.requestAccessService.approve(id, reviewerId, role);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  reject(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') reviewerId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.requestAccessService.reject(id, reviewerId, role);
  }
}
