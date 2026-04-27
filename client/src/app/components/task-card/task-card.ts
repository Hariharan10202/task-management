import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task, TaskAttachment } from '../../core/models/task.model';

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

  @Output() uploadAttachment = new EventEmitter<{ taskId: string; file: File }>();
  @Output() deleteAttachment = new EventEmitter<{ taskId: string; attachmentId: string }>();

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

  onFileSelected(event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.task.id) return;

    this.uploadAttachment.emit({ taskId: this.task.id, file });
    input.value = '';
  }

  onDeleteAttachment(attachmentId: string, event: MouseEvent) {
    event.stopPropagation();
    if (!this.task.id) return;
    this.deleteAttachment.emit({ taskId: this.task.id, attachmentId });
  }

  get attachments(): TaskAttachment[] {
    return this.task.attachments ?? [];
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  isCheckboxDisabled(task: Task): boolean {
    if (!task.due_at) return false;

    const due = new Date(task.due_at).getTime();
    const now = new Date().getTime();

    const isOverdue = due < now;
    const isCompleted = task.status === 'completed';

    return isOverdue && isCompleted;
  }

  isOverdue(task: any): boolean {
    if (!task.due_at) return false;

    const due = new Date(task.due_at).getTime();
    const now = new Date().getTime();

    return task.status !== 'completed' && due < now;
  }
}
