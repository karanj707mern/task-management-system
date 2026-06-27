import { IsOptional, IsString, IsEnum, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { PRStatus } from '@prisma/client';

export class UpdatePrDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(PRStatus)
  status?: PRStatus;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
