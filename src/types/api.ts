/** Mirrors src/common/dto/pagination.dto.ts in the backend. Every list endpoint returns this. */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

/** Query params every list endpoint accepts (PaginationQueryDto). limit is capped at 100. */
export type PageQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
};
