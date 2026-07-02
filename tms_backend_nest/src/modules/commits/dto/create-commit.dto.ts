import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommitDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  prId?: string;

  @IsString()
  @IsNotEmpty()
  sha: string;
}
