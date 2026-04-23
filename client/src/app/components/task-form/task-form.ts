import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../../core/models/task.model';
import { noPastDateValidator } from '../../core/validators/date';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm {
  @Input() task: Task | null = null;
  @Output() save = new EventEmitter<Task>();
  @Output() close = new EventEmitter<void>();
  today = new Date().toISOString().split('T')[0];
  form: FormGroup;
  private taskId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['pending', Validators.required],
      priority: ['medium', Validators.required],
      due_date: ['', noPastDateValidator],
    });
  }

  ngOnChanges(): void {
    if (this.task) {
      this.taskId = this.task.id ?? null;
      this.form.patchValue({
        id: this.task.id,
        title: this.task.title,
        description: this.task.description ?? '',
        status: this.task.status,
        priority: this.task.priority,
        due_date: this.task.due_date ?? '',
      });
    } else {
      this.taskId = null;
      this.form.reset({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: null,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const task: Task = { id: this.taskId ?? undefined, ...this.task, ...this.form.value };

    this.save.emit(task);
  }

  closeModal() {
    this.close.emit();
  }
}
