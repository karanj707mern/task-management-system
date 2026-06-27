import { IsNotEmpty, IsString } from 'class-validator';

export class AddReviewerDto {
  @IsString()
  @IsNotEmpty()
  reviewerId: string;
}
