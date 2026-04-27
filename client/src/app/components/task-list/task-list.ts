import { Component, computed, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';

import { Task, TaskAttachment } from '../../core/models/task.model';
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

import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface TaskFilters {
  search: string;
  status: string;
  sort: string;
}

interface AttachmentUploadEvent {
  taskId: string;
  file: File;
}

interface AttachmentActionEvent {
  taskId: string;
  attachmentId: string;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    TaskForm,
    Modal,
    TaskFilter,
    TaskCard,
    TaskToast,
    TaskPagination,
    TaskStats,
    DragDropModule,
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit {
  constructor(
    private taskService: TaskService,
    private toast: ToastService,
  ) {}

  // UI State
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

  // Single source of truth
  latestTasks = signal<Task[]>([]);

  // Request state
  state = signal({
    search: '',
    status: '',
    priority: '',
    sort: '',
    page: 1,
  });

  private currentRequest?: Subscription;
  private readonly destroyRef = inject(DestroyRef);

  // ---------------- INIT ----------------
  ngOnInit() {
    this.fetchTasks();
  }

  ngOnDestroy(): void {
    this.currentRequest?.unsubscribe();
  }

  // ---------------- API ----------------
  private fetchTasks() {
    this.loading.set(true);

    this.taskService
      .getTasks(this.state())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.latestTasks.set(res.data);
          this.totalPages.set(Math.ceil(res.total / this.limit));
          this.hasMore = res.page * this.limit < res.total;
        },
        error: () => {
          this.toast.show('Failed to load tasks', 'error');
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }

  private refreshCurrentPage() {
    this.fetchTasks();
  }

  // ---------------- FILTER / PAGINATION ----------------
  onFiltersChanged(event: TaskFilters) {
    this.state.update((s) => ({
      ...s,
      ...event,
      page: 1,
    }));

    this.fetchTasks();
  }

  onPageChange(page: number) {
    this.state.update((s) => ({
      ...s,
      page,
    }));

    this.fetchTasks();
  }

  get page() {
    return this.state().page;
  }

  // ---------------- CRUD ----------------
  create(task: Task) {
    this.taskService.createTask(task).subscribe(() => {
      this.toast.show('Task created successfully', 'success');
      this.closeForm();
      this.refreshCurrentPage();
    });
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

      this.state.update((s) => ({ ...s, page: 1 }));
      this.fetchTasks();
    });
  }

  // ---------------- UI ACTIONS ----------------
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

  // ---------------- SELECTION ----------------
  toggleSelect(taskId: string) {
    const updated = new Set(this.selectedTaskIds());

    updated.has(taskId) ? updated.delete(taskId) : updated.add(taskId);

    this.selectedTaskIds.set(updated);
  }

  isSelectedMap = computed(() => new Set(this.selectedTaskIds()));
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

    this.taskService
      .updateTask(task.id!, { ...task, status: newStatus })
      .subscribe(() => this.refreshCurrentPage());
  }

  // ---------------- DUPLICATE ----------------
  private generateCopyTitle(title: string): string {
    const copyRegex = /\(Copy(?: (\d+))?\)$/;

    if (!copyRegex.test(title)) return `${title} (Copy)`;

    return title.replace(copyRegex, (_, num) => `(Copy ${num ? +num + 1 : 2})`);
  }

  openDuplicate(task: Task) {
    this.selectedTask.set({
      ...task,
      id: undefined,
      title: this.generateCopyTitle(task.title),
      status: 'pending',
      due_at: undefined,
    });

    this.formMode.set('duplicate');
    this.showForm.set(true);
  }

  // ---------------- EXPORT ----------------
  private formatTasks(tasks: Task[]) {
    return tasks.map((t) => ({
      Title: t.title,
      Description: t.description ?? '',
      Status: t.status,
      Priority: t.priority ?? '',
      DueDate: t.due_at ? new Date(t.due_at).toLocaleString() : '',
      CreatedAt: t.created_at ? new Date(t.created_at).toLocaleString() : '',
    }));
  }

  private exportFromData(tasks: Task[]) {
    if (!tasks.length) {
      this.toast.show('No tasks to export', 'info');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(this.formatTasks(tasks));
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `tasks_${Date.now()}.xlsx`);

    this.toast.show('Export successful', 'success');
  }

  private exportAll() {
    this.taskService
      .getTasks({ ...this.state(), page: 1, limit: 1000 })
      .subscribe((res) => this.exportFromData(res.data));
  }

  handleExport(event: Partial<{ scope: string | null }>) {
    event.scope === 'page' ? this.exportFromData(this.latestTasks()) : this.exportAll();
  }

  // ---------------- DRAG DROP ----------------
  private updateTaskOrder(tasks: Task[]) {
    const payload = tasks.map((task, index) => ({
      id: task.id!,
      order: index,
    }));

    this.taskService.updateTaskOrder(payload).subscribe({
      next: () => {
        this.toast.show('Task order updated', 'info');
        this.fetchTasks();
      },
      error: (e) => {
        this.toast.show('Failed to update order', 'error');
        this.refreshCurrentPage();
      },
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const updated = [...event.container.data];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    this.latestTasks.set(updated);
    this.updateTaskOrder(updated);
  }

  // ---------------- ATTACHMENTS ----------------

  private addAttachmentToTask(taskId: string, attachment: TaskAttachment) {
    this.latestTasks.update((tasks) =>
      tasks.map((t) =>
        t.id === taskId ? { ...t, attachments: [attachment, ...(t.attachments ?? [])] } : t,
      ),
    );
  }

  private removeAttachmentFromTask(taskId: string, attachmentId: string) {
    this.latestTasks.update((tasks) =>
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, attachments: (t.attachments ?? []).filter((a) => a.id !== attachmentId) }
          : t,
      ),
    );
  }

  private getAttachmentName(taskId: string, attachmentId: string): string {
    const task = this.latestTasks().find((t) => t.id === taskId);
    const attachment = task?.attachments?.find((a) => a.id === attachmentId);
    return attachment?.original_name ?? 'attachment';
  }

  onUploadAttachment(event: AttachmentUploadEvent) {
    this.taskService.uploadTaskAttachment(event.taskId, event.file).subscribe({
      next: (attachment) => {
        this.addAttachmentToTask(event.taskId, attachment);
        this.toast.show('Attachment uploaded', 'success');
      },
      error: () => this.toast.show('Upload failed', 'error'),
    });
  }

  onDeleteAttachment(event: AttachmentActionEvent) {
    this.taskService.deleteTaskAttachment(event.taskId, event.attachmentId).subscribe({
      next: () => {
        this.removeAttachmentFromTask(event.taskId, event.attachmentId);
        this.toast.show('Attachment deleted', 'info');
      },
      error: () => this.toast.show('Delete failed', 'error'),
    });
  }

  // ---------------- STATS ----------------
  total = computed(() => this.latestTasks().length);

  pending = computed(() => this.latestTasks().filter((t) => t.status === 'pending').length);

  inProgress = computed(() => this.latestTasks().filter((t) => t.status === 'in_progress').length);

  completed = computed(() => this.latestTasks().filter((t) => t.status === 'completed').length);

  overdue = computed(
    () =>
      this.latestTasks().filter(
        (t) => t.status !== 'completed' && t.due_at && new Date(t.due_at).getTime() < Date.now(),
      ).length,
  );
}
