import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { EpicStatus } from '@prisma/client';

export class CreateEpicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
