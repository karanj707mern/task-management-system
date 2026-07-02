import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class ArchiveProjectDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
