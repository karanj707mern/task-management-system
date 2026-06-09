import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * Create comment DTO
 */
export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsNotEmpty()
  @IsUUID()
  taskId!: string;
}

/**
 * Update comment DTO
 */
export class UpdateCommentDto {
  @IsNotEmpty()
  @IsString()
  content!: string;
}
