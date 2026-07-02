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

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import type { IPaginationQuery } from '@/common/types/common.types';
import { CodeReviewsService } from './code-reviews.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('code-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CodeReviewsController {
  constructor(private readonly codeReviewsService: CodeReviewsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  create(@Body() dto: CreateReviewDto, @GetUser('userId') userId: string, @GetUser('role') role: UserRole) {
    return this.codeReviewsService.create(dto, userId, role);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findAll(
    @Query('prId') prId: string,
    @Query('reviewerId') reviewerId: string,
    @Query() query: IPaginationQuery,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.codeReviewsService.findAll(prId, reviewerId, query, userId, role);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  findOne(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.codeReviewsService.findOne(id, userId, role);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.codeReviewsService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.codeReviewsService.remove(id, userId, role);
  }
}
