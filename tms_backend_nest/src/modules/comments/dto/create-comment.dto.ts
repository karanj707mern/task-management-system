import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;

  @IsNotEmpty()
  @IsUUID()
  taskId: string;
}
