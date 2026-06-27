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
import { CreatePrDto } from './dto/create-pr.dto';
import { UpdatePrDto } from './dto/update-pr.dto';
import { MergePrDto } from './dto/merge-pr.dto';
import { AddReviewerDto } from './dto/add-reviewer.dto';
import { PrService } from './pr.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UserRole, PRStatus, ReviewStatus } from '@prisma/client';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('pull-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrController {
  constructor(private readonly prService: PrService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  create(@Body() dto: CreatePrDto, @GetUser('userId') userId: string) {
    return this.prService.create(dto, userId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findAll(
    @Query() query: {
      taskId?: string;
      status?: PRStatus;
      authorId?: string;
      reviewerId?: string;
      page?: number;
      limit?: number;
    },
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.prService.findAll(query, userId, role);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.prService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdatePrDto) {
    return this.prService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.prService.remove(id);
  }

  @Post(':id/merge')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  merge(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: MergePrDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.prService.merge(id, userId, role, dto);
  }

  @Post(':id/reviewer')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  assignReviewer(
    @Param('id', ParseCuidPipe) id: string,
    @Body('reviewerId') reviewerId: string,
  ) {
    return this.prService.assignReviewer(id, reviewerId);
  }

  @Post(':id/reviewers')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  addReviewer(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: AddReviewerDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.prService.addReviewer(id, dto, userId, role);
  }

  @Delete(':id/reviewers/:reviewerId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  removeReviewer(
    @Param('id', ParseCuidPipe) id: string,
    @Param('reviewerId', ParseCuidPipe) reviewerId: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.prService.removeReviewer(id, reviewerId, userId, role);
  }

  @Patch(':id/reviewers/:reviewerId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  updateReviewerStatus(
    @Param('id', ParseCuidPipe) id: string,
    @Param('reviewerId', ParseCuidPipe) reviewerId: string,
    @Body('status') status: ReviewStatus,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.prService.updateReviewerStatus(id, reviewerId, status, userId, role);
  }

  @Get('task/:taskId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findByTask(
    @Param('taskId', ParseCuidPipe) taskId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.prService.findByTask(taskId, query);
  }
}
