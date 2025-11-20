/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Filter operators
 */
export type FilterOperator = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';

/**
 * Generic filter
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Date range filter
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Query options for list endpoints
 */
export interface QueryOptions extends PaginationParams {
  search?: string;
  filters?: Filter[];
  dateRange?: DateRange;
  [key: string]: any; // Allow additional query parameters
}
