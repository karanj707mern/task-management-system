import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Business logic exception for domain-specific errors
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        statusCode,
        message,
        error: 'Business Error',
      },
      statusCode,
    );
  }
}
