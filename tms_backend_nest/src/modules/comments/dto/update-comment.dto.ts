import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}
