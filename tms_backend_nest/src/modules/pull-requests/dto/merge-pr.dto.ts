import { IsOptional, IsString } from 'class-validator';

export class MergePrDto {
  @IsOptional()
  @IsString()
  reviewerId?: string;
}
