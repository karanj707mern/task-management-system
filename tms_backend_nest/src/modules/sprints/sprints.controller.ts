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

import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UpdateSprintStatusDto } from './dto/update-sprint-status.dto';
import { SprintsQueryDto } from '@/common/dto/pagination-query.dto';
import { SprintsService } from './sprints.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('sprints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  create(
    @Body() dto: CreateSprintDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.create(dto, userId, role);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findAll(@GetUser('role') role: UserRole, @Query() query: SprintsQueryDto) {
    return this.sprintsService.findAll(role, query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.findOne(id, role);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateSprintDto,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.update(id, dto, role);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  updateStatus(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateSprintStatusDto,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.updateStatus(id, dto.status, role);
  }

  @Patch(':id/close')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  closeSprint(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.closeSprint(id, role);
  }

  @Get(':id/progress')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  getSprintProgress(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.getSprintProgress(id, role);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.sprintsService.remove(id, role);
  }
}
