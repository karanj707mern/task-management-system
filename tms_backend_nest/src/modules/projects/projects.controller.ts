import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ArchiveProjectDto } from './dto/archive-project.dto';
import { ProjectsQueryDto } from '@/common/dto/pagination-query.dto';

import { ProjectsService } from './projects.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  create(@Body() dto: CreateProjectDto, @GetUser('role') role: UserRole) {
    return this.projectsService.create(dto, role);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findAll(@Query() query: ProjectsQueryDto, @GetUser('userId') userId: string, @GetUser('role') role: UserRole) {
    return this.projectsService.findAll(query, userId, role);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(@Param('id', ParseCuidPipe) id: string, @GetUser('role') role: UserRole) {
    return this.projectsService.findOne(id, role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @GetUser('role') role: UserRole,
  ) {
    return this.projectsService.update(id, dto, role);
  }
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id', ParseCuidPipe) id: string, @GetUser('role') role: UserRole) {
    return this.projectsService.remove(id, role);
  }

  @Patch(':id/archive')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  archive(@Param('id', ParseCuidPipe) id: string, @Body() dto: ArchiveProjectDto, @GetUser('role') role: UserRole) {
    return this.projectsService.archive(id, dto, role);
  }
}
