import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class ArchiveTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
