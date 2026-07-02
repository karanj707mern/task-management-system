import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class UpdateSprintDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @IsOptional()
  @IsString()
  epicId?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;
}
