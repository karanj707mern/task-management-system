import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  githubRepoId?: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  githubRepoUrl?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  githubRepoId?: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  githubRepoUrl?: string;
}

export class ListProjectsQueryDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(50)
  status?: string;
}
