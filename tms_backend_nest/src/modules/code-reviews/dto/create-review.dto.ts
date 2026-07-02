import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  prId: string;

  @IsString()
  @IsNotEmpty()
  reviewerId: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  comments?: string;
}
