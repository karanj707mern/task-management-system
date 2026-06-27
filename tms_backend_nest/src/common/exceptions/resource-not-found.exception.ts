import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with id ${identifier} not found`
      : `${resource} not found`;
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
