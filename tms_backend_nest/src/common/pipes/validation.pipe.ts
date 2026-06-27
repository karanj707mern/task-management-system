import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (!value) return value;

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object: object = plainToInstance(
      metatype as new (...args: unknown[]) => object,
      value,
    );
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((error) => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', '),
      }));
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
