import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environment';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private api = `${environment.apiUrl}/tasks`;

  loading = signal(false);

  constructor(private http: HttpClient) {}

  getTasks(filters?: { status?: string; priority?: string }) {
    this.loading.set(true);

    let params: { status?: string; priority?: string } = {};

    if (filters?.status) {
      params.status = filters.status;
    }

    if (filters?.priority) {
      params.priority = filters.priority;
    }

    return this.http.get<Task[]>(this.api + '/', { params }).pipe(
      tap(() => {
        this.loading.set(false);
      }),
    );
  }

  createTask(task: Task) {
    return this.http.post<Task>(this.api + '/', task);
  }

  updateTask(id: string, task: Task) {
    return this.http.put<Task>(`${this.api}/${id}/`, task);
  }

  deleteTask(id: string) {
    return this.http.delete(`${this.api}/${id}/`);
  }
}
