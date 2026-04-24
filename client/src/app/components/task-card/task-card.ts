import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [DatePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCard {
  @Input() task!: Task;
  @Input() selected = false;

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusToggle = new EventEmitter<Task>();
  @Output() cardSelect = new EventEmitter<void>();
  @Output() duplicateTask = new EventEmitter<Task>();

  onEdit() {
    this.edit.emit(this.task);
  }

  onDelete() {
    this.delete.emit(this.task.id!);
  }

  duplicate() {
    this.duplicateTask.emit(this.task);
  }

  toggleStatus(task: Task) {
    this.statusToggle.emit(task);
  }

  onCardClick(event: MouseEvent) {
    this.cardSelect.emit();
  }

  isCheckboxDisabled(task: Task): boolean {
    if (!task.due_date) return false;

    const due = new Date(task.due_date).getTime();
    const now = new Date().getTime();

    const isOverdue = due < now;
    const isCompleted = task.status === 'completed';

    return isOverdue && isCompleted;
  }

  isOverdue(task: any): boolean {
    if (!task.due_date) return false;

    const due = new Date(task.due_date).getTime();
    const now = new Date().getTime();

    return task.status !== 'completed' && due < now;
  }
}
