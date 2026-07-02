import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsOptional()
  epicId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
