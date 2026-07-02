import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CreateEpicDto } from './dto/create-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { UpdateEpicStatusDto } from './dto/update-epic-status.dto';
import { EpicsService } from './epics.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UserRole } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('epics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  create(
    @Body() dto: CreateEpicDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.epicsService.create(dto, userId, role);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findAll(
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
    @Query() query: PaginationQueryDto,
  ) {
    return this.epicsService.findAll(userId, role, query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.epicsService.findOne(id, userId, role);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateEpicDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.epicsService.update(id, dto, userId, role);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  updateStatus(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateEpicStatusDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.epicsService.updateStatus(id, dto.status, userId, role);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.epicsService.remove(id, userId, role);
  }

  @Get(':id/progress')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  getProgress(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.epicsService.getEpicProgress(id, userId, role);
  }
}
