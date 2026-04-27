export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at?: string;
  due_at?: string;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: string;
  original_name: string;
  size_bytes: number;
  content_type?: string;
  created_at?: string;
}

export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  sort: string;
}

export interface TaskResponse {
  data: Task[];
  page: number;
  total: number;
}

export type paramsType = {
  status?: string;
  priority?: string;
  limit: number;
  page: number;
};

export interface TaskParams {
  status?: string;
  priority?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}
