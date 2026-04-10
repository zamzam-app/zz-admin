/**
 * Mirrors backend QueryTaskDto — query params for GET /tasks.
 * Enum fields use backend string values (e.g. OPEN, HYGIENE).
 */
export interface QueryTaskDto {
  page?: number;
  limit?: number;
  outletId?: string;
  status?: string;
  taskCategoryId?: string;
  category?: string; // alias
  priority?: string;
  assigneeId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
}
