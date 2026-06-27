import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized access') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message,
        error: 'Unauthorized',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
