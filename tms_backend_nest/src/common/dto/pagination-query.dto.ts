import { IsOptional, IsString, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { SprintStatus, UserRole, TaskStatus, TaskPriority } from '@prisma/client';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class TeamsQueryDto extends PaginationQueryDto {}

export class UsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TasksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  epicId?: string;

  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  parentTaskId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class SprintsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  epicId?: string;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;
}

export class BranchesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  sprintId?: string;
}

export class ProjectsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}