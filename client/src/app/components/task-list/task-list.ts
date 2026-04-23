import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { map, Observable } from 'rxjs';

import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task-service';

import { Modal } from '../modal/modal';
import { TaskCard } from '../task-card/task-card';
import { TaskFilter } from '../task-filter/task-filter';
import { TaskForm } from '../task-form/task-form';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskForm, Modal, TaskFilter, AsyncPipe, TaskCard],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList {
  constructor(private taskService: TaskService) {}

  tasks$!: Observable<Task[]>;
  total$!: Observable<number>;
  pending$!: Observable<number>;
  inProgress$!: Observable<number>;
  completed$!: Observable<number>;

  showForm = signal(false);
  showConfirmModal = signal(false);
  taskToDeleteId = signal<string | null>(null);
  selectedTask = signal<Task | null>(null);
  loading = signal(false);

  searchText = '';
  statusFilter = '';
  priorityFilter = '';

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading.set(true);
    const stream$ = this.taskService
      .getTasks({
        status: this.statusFilter,
        priority: this.priorityFilter,
      })
      .pipe(
        map((tasks) =>
          tasks.filter((task) => {
            const search = this.searchText.toLowerCase();

            const matchesSearch =
              !search ||
              task.title.toLowerCase().includes(search) ||
              task.description?.toLowerCase().includes(search);

            return matchesSearch;
          }),
        ),
      );

    this.tasks$ = stream$;

    this.tasks$.subscribe(() => this.loading.set(false));

    this.total$ = stream$.pipe(map((t) => t.length));
    this.pending$ = stream$.pipe(map((t) => t.filter((x) => x.status === 'pending').length));
    this.inProgress$ = stream$.pipe(map((t) => t.filter((x) => x.status === 'in_progress').length));
    this.completed$ = stream$.pipe(map((t) => t.filter((x) => x.status === 'completed').length));
  }

  create(task: Task) {
    this.taskService.createTask(task).subscribe(() => {
      this.closeForm();
      this.loadTasks();
    });
  }

  update(task: Task) {
    this.taskService.updateTask(task.id!, task).subscribe(() => {
      this.closeForm();
      this.loadTasks();
    });
  }

  editTask(task: Task) {
    this.selectedTask.set(task);
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

  confirmDelete() {
    const id = this.taskToDeleteId();
    if (!id) return;

    this.taskService.deleteTask(id).subscribe(() => {
      this.cancelDelete();
      this.loadTasks();
    });
  }

  cancelDelete() {
    this.taskToDeleteId.set(null);
    this.showConfirmModal.set(false);
  }

  onFiltersChanged(event: { search: string; status: string; priority: string }) {
    this.searchText = event.search;
    this.statusFilter = event.status;
    this.priorityFilter = event.priority;

    this.loadTasks();
  }
}
