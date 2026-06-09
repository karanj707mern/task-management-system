import { Expose } from 'class-transformer';

export class SuccessResponseDto<T> {
  @Expose()
  success: boolean = true;

  @Expose()
  data: T;

  @Expose()
  message: string;

  @Expose()
  timestamp: string;
}

export class PaginatedResponseDto<T> {
  @Expose()
  success: boolean = true;

  @Expose()
  data: T[];

  @Expose()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @Expose()
  timestamp: string;
}

export class ErrorResponseDto {
  @Expose()
  success: boolean = false;

  @Expose()
  message: string;

  @Expose()
  error?: any;

  @Expose()
  timestamp: string;
}
