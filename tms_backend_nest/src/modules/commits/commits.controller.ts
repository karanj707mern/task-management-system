import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateCommitDto } from './dto/create-commit.dto';
import { CommitsService } from './commits.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('commits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommitsController {
  constructor(private readonly commitsService: CommitsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  create(
    @Body() dto: CreateCommitDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.commitsService.create(dto, userId, role);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findAll(
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
    @Query() query: { branchId?: string; taskId?: string; prId?: string; authorId?: string; page?: number; limit?: number },
  ) {
    return this.commitsService.findAll(userId, role, query);
  }

  @Get('task/:taskId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findByTask(
    @Param('taskId', ParseCuidPipe) taskId: string,
    @Query() query: { page?: number; limit?: number },
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.commitsService.findByTask(taskId, query, userId, role);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.commitsService.findOne(id, userId, role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.commitsService.remove(id, userId, role);
  }
}
