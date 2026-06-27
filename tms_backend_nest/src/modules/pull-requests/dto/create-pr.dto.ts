import { IsNotEmpty, IsOptional, IsString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { PRStatus } from '@prisma/client';

export class CreatePrDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  sourceBranch: string;

  @IsString()
  @IsNotEmpty()
  targetBranch: string;

  @IsOptional()
  @IsEnum(PRStatus)
  status?: PRStatus;

  @IsString()
  @IsOptional()
  reviewerId?: string;
}
