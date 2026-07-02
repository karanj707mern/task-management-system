import { IsEnum } from 'class-validator';
import { EpicStatus } from '@prisma/client';

export class UpdateEpicStatusDto {
  @IsEnum(EpicStatus)
  status: EpicStatus;
}
