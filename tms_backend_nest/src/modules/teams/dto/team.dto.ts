import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * Create team DTO
 */
export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Update team DTO
 */
export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
