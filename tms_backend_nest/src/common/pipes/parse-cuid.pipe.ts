import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

function isCuid(value: string): boolean {
  return /^c[a-z0-9]{24,}$/.test(value);
}

function isUuid(value: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
}

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isCuid(value) && !isUuid(value)) {
      throw new BadRequestException(`Invalid ID format for ${metadata.data}`);
    }
    return value;
  }
}
