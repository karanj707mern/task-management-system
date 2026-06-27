import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  TaskStatus,
  TaskPriority,
} from '../../../common/constants/app.constants';
import { LinkType } from '@prisma/client';

export class CreateTaskDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus = TaskStatus.TODO;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  dueDate?: Date;
}

export class UpdateTaskDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  dueDate?: Date;
}

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class CreateWorkLogDto {
  @IsNotEmpty()
  @IsNumber()
  hours: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class LinkTasksDto {
  @IsNotEmpty()
  @IsString()
  linkedTaskId: string;

  @IsNotEmpty()
  @IsEnum(LinkType)
  linkType: LinkType;
}

export class WatchTaskDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
