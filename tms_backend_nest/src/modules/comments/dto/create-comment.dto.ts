import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsNotEmpty()
  @IsUUID()
  taskId!: string;
}
