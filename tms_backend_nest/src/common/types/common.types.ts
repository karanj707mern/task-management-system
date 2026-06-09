export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface IErrorResponse {
  success: false;
  message: string;
  error?: any;
  timestamp: string;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface ISortQuery {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface IPaginationQuery extends ISortQuery {
  page?: number;
  limit?: number;
}
