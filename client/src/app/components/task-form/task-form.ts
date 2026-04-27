import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
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
  @Input() mode: 'create' | 'edit' | 'duplicate' = 'create';

  @Output() save = new EventEmitter<Task>();
  @Output() close = new EventEmitter<void>();

  minDateTime = this.toDateTimeLocal(new Date());
  form: FormGroup;
  private taskId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['pending', Validators.required],
      priority: ['medium', Validators.required],
      due_at: ['', noPastDateValidator], // validator works if it parses full datetime
    });
  }

  ngOnInit(): void {
    this.restoreDraft();
    this.form.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(value));
    });
  }

  private toDateTimeLocal(value: string | Date): string {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private getStorageKey(): string {
    if (this.mode === 'edit' && this.task?.id) return `task_form_draft_${this.task.id}`;
    return 'task_form_draft_new';
  }

  private restoreDraft(): void {
    const draft = localStorage.getItem(this.getStorageKey());
    if (draft) this.form.patchValue(JSON.parse(draft));
  }

  ngOnChanges(): void {
    if (this.task) {
      this.taskId = this.task.id ?? null;
      this.form.patchValue({
        title: this.task.title,
        description: this.task.description ?? '',
        status: this.task.status,
        priority: this.task.priority,
        due_at: this.task.due_at ? this.toDateTimeLocal(this.task.due_at) : null,
      });
      this.restoreDraft();
    } else {
      this.taskId = null;
      this.form.reset({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_at: null,
      });
      this.restoreDraft();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload = {
      ...raw,
      due_at: raw.due_at ? new Date(raw.due_at).toISOString() : null, // send ISO to backend
    };

    const task: Task = this.mode === 'edit' ? { id: this.taskId!, ...payload } : { ...payload };

    localStorage.removeItem(this.getStorageKey());
    this.save.emit(task);
  }

  closeModal() {
    localStorage.removeItem(this.getStorageKey());
    this.close.emit();
  }
}
