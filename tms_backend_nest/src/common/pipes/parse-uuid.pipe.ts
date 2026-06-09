import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!uuidValidate(value)) {
      throw new BadRequestException(`Invalid UUID format for ${metadata.data}`);
    }
    return value;
  }
}
