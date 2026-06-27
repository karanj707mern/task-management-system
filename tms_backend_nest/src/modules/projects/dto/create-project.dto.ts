import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsUrl } from 'class-validator';
import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  githubRepoId?: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  githubRepoUrl?: string;
}
