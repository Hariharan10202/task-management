import { AsyncPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { BehaviorSubject, forkJoin, map, shareReplay, switchMap, tap } from 'rxjs';

import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task/task-service';

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { ToastService } from '../../core/services/toast/toast-service';
import { Modal } from '../modal/modal';
import { TaskCard } from '../task-card/task-card';
import { TaskFilter } from '../task-filter/task-filter';
import { TaskForm } from '../task-form/task-form';
import { TaskPagination } from '../task-pagination/task-pagination';
import { TaskStats } from '../task-stats/task-stats';
import { TaskToast } from '../task-toast/task-toast';
interface TaskFilters {
  search: string;
  status: string;
  sort: string;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskForm, Modal, TaskFilter, AsyncPipe, TaskCard, TaskToast, TaskPagination, TaskStats],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList {
  constructor(
    private taskService: TaskService,
    private toast: ToastService,
  ) {}

  showForm = signal(false);
  showConfirmModal = signal(false);
  taskToDeleteId = signal<string | null>(null);
  selectedTask = signal<Task | null>(null);
  loading = signal(false);
  totalPages = signal(0);
  formMode = signal<'duplicate' | 'create' | 'edit'>('create');
  selectedTaskIds = signal<Set<string>>(new Set());

  limit = 9;
  hasMore = true;

  private state$ = new BehaviorSubject({
    search: '',
    status: '',
    priority: '',
    sort: '',
    page: 1,
  });

  latestTasks = signal<Task[]>([]);

  tasks$ = this.state$.pipe(
    tap(() => this.loading.set(true)),

    switchMap((state) =>
      this.taskService.getTasks(state).pipe(
        tap((res) => {
          this.totalPages.set(Math.ceil(res.total / this.limit));
          this.hasMore = res.page * this.limit < res.total;

          this.latestTasks.set(res.data);
        }),
        map((res) => res.data),
        tap(() => this.loading.set(false)),
      ),
    ),

    shareReplay(1),
  );

  page$ = this.state$.pipe(map((s) => s.page));
  total$ = this.tasks$.pipe(map((t) => t.length));

  pending$ = this.tasks$.pipe(map((t) => t.filter((x) => x.status === 'pending').length));

  inProgress$ = this.tasks$.pipe(map((t) => t.filter((x) => x.status === 'in_progress').length));

  completed$ = this.tasks$.pipe(map((t) => t.filter((x) => x.status === 'completed').length));

  overdue$ = this.tasks$.pipe(
    map(
      (tasks) =>
        tasks.filter(
          (t) =>
            t.status !== 'completed' && t.due_date && new Date(t.due_date).getTime() < Date.now(),
        ).length,
    ),
  );

  onFiltersChanged(event: TaskFilters) {
    this.state$.next({
      ...this.state$.value,
      ...event,
      page: 1,
    });
  }

  onPageChange(page: number) {
    this.state$.next({
      ...this.state$.value,
      page,
    });
  }

  get page() {
    return this.state$.value.page;
  }

  private refreshCurrentPage() {
    this.state$.next(this.state$.value);
  }

  create(task: Task) {
    this.taskService
      .createTask(task)
      .pipe(
        tap(() => {
          this.toast.show('Task created successfully', 'success');
          this.closeForm();
          this.refreshCurrentPage();
        }),
      )
      .subscribe();
  }

  update(task: Task) {
    this.taskService.updateTask(task.id!, task).subscribe(() => {
      this.toast.show('Task updated successfully', 'info');
      this.closeForm();
      this.refreshCurrentPage();
    });
  }

  confirmDelete() {
    const id = this.taskToDeleteId();
    if (!id) return;

    this.taskService.deleteTask(id).subscribe(() => {
      this.toast.show('Task deleted successfully', 'error');

      this.cancelDelete();
      this.state$.next({
        ...this.state$.value,
        page: 1,
      });
    });
  }

  editTask(task: Task) {
    this.selectedTask.set(task);
    this.formMode.set('edit');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.selectedTask.set(null);
  }

  openDeleteConfirm(id: string) {
    this.taskToDeleteId.set(id);
    this.showConfirmModal.set(true);
  }

  cancelDelete() {
    this.taskToDeleteId.set(null);
    this.showConfirmModal.set(false);
  }

  toggleSelect(taskId: string) {
    const updated = new Set(this.selectedTaskIds());

    if (updated.has(taskId)) {
      updated.delete(taskId);
    } else {
      updated.add(taskId);
    }

    this.selectedTaskIds.set(updated);
  }

  isSelectedMap = computed(() => {
    const set = this.selectedTaskIds();
    return new Set(set);
  });

  selectedCount = computed(() => this.selectedTaskIds().size);

  deleteSelected() {
    const ids = Array.from(this.selectedTaskIds());

    if (!ids.length) return;

    forkJoin(ids.map((id) => this.taskService.deleteTask(id))).subscribe(() => {
      this.toast.show('Tasks deleted successfully', 'error');
      this.refreshCurrentPage();
      this.selectedTaskIds.set(new Set());
    });
  }

  markSelectedCompleted() {
    const ids = Array.from(this.selectedTaskIds());

    if (!ids.length) return;

    forkJoin(ids.map((id) => this.taskService.updateTask(id, { status: 'completed' }))).subscribe(
      () => {
        this.toast.show('Tasks marked completed', 'success');
        this.refreshCurrentPage();
        this.selectedTaskIds.set(new Set());
      },
    );
  }

  statusToggle(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    this.taskService.updateTask(task.id!, { ...task, status: newStatus }).subscribe(() => {
      this.refreshCurrentPage();
    });
  }

  private generateCopyTitle(title: string): string {
    const copyRegex = /\(Copy(?: (\d+))?\)$/;

    if (!copyRegex.test(title)) {
      return `${title} (Copy)`;
    }

    return title.replace(copyRegex, (_, num) => {
      const next = num ? Number(num) + 1 : 2;
      return `(Copy ${next})`;
    });
  }

  openDuplicate(task: Task) {
    const duplicated: Task = {
      ...task,
      id: undefined,
      title: this.generateCopyTitle(task.title),
      status: 'pending',
      due_date: undefined,
    };

    this.selectedTask.set(duplicated);
    this.formMode.set('duplicate');
    this.showForm.set(true);
  }

  private formatTasks(tasks: Task[]) {
    return tasks.map((t) => ({
      Title: t.title,
      Description: t.description ?? '',
      Status: t.status,
      Priority: t.priority ?? '',
      DueDate: t.due_date ? new Date(t.due_date).toLocaleString() : '',
      CreatedAt: t.created_at ? new Date(t.created_at).toLocaleString() : '',
    }));
  }

  private exportFromData(tasks: Task[]) {
    if (!tasks.length) {
      this.toast.show('No tasks to export', 'info');
      return;
    }

    const data = this.formatTasks(tasks);

    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `tasks_${Date.now()}.xlsx`);

    this.toast.show('Export successful', 'success');
  }

  private exportAll() {
    this.taskService
      .getTasks({
        ...this.state$.value,
        page: 1,
        limit: 1000,
      })
      .pipe(
        tap((res) => {
          this.exportFromData(res.data);
        }),
      )
      .subscribe();
  }

  handleExport(event: Partial<{ scope: string | null }>) {
    const { scope } = event;

    if (scope === 'page') {
      this.exportFromData(this.latestTasks());
    } else {
      this.exportAll();
    }
  }
}
