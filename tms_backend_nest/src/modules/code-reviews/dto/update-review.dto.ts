import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class UpdateReviewDto {
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  comments?: string;
}
