import { IsOptional, IsString, IsEnum } from 'class-validator';
import { EpicStatus } from '@prisma/client';

export class UpdateEpicDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsOptional()
  @IsEnum(EpicStatus)
  status?: EpicStatus;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
