import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { filter, tap } from 'rxjs';
import { environment } from '../../../../environment.prod';
import { paramsType, Task, TaskParams, TaskResponse } from '../../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private api = `${environment.apiUrl}/tasks`;

  loading = signal(false);

  constructor(private http: HttpClient) {}

  getTasks(filters?: TaskParams) {
    this.loading.set(true);

    const params: Record<string, string | number> = {};

    if (filters?.status) params['status'] = filters.status;
    if (filters?.priority) params['priority'] = filters.priority;
    if (filters?.search) params['search'] = filters.search;
    if (filters?.sort) params['sort'] = filters.sort;
    if (filters?.page) params['page'] = filters.page;
    if (filters?.limit) params['limit'] = filters.limit;

    return this.http
      .get<TaskResponse>(this.api + '/', {
        params,
        responseType: 'json',
      })
      .pipe(tap(() => this.loading.set(false)));
  }

  createTask(task: Task) {
    return this.http.post<Task>(this.api + '/', task);
  }

  updateTask(id: string, task: Partial<Task>) {
    return this.http.put<Task>(`${this.api}/${id}/`, task);
  }

  deleteTask(id: string) {
    return this.http.delete(`${this.api}/${id}/`);
  }
}
