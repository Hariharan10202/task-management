import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-task-filter',
  standalone: true,
  imports: [ReactiveFormsModule, Modal],
  templateUrl: './task-filter.html',
  styleUrl: './task-filter.css',
})
export class TaskFilter {
  @Input() selectCount: number = 0;

  @Output() delete = new EventEmitter<void>();
  @Output() markAsCompleted = new EventEmitter<void>();
  @Output() filtersChanged = new EventEmitter<{
    search: string;
    status: string;
    priority: string;
    sort: string;
  }>();
  @Output() handleExport = new EventEmitter<typeof this.exportForm.value>();

  showActions = computed(() => this.selectCount > 0);
  showDeleteConfirmModal = signal(false);
  showMarkModal = signal(false);

  form = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    priority: new FormControl(''),
    sort: new FormControl(''),
  });

  exportForm = new FormGroup({
    scope: new FormControl('page'),
  });

  constructor() {
    this.form.valueChanges.pipe(debounceTime(600), distinctUntilChanged()).subscribe(() => {
      this.emitChanges();
    });
  }

  emitChanges() {
    const value = this.form.value;

    this.filtersChanged.emit({
      search: value.search ?? '',
      status: value.status ?? '',
      priority: value.priority ?? '',
      sort: value.sort ?? '',
    });
  }

  deleteSelected() {
    this.delete.emit();
    this.showDeleteConfirmModal.set(false);
  }

  cancel() {
    this.showDeleteConfirmModal.set(false);
    this.showMarkModal.set(false);
  }

  markSelectedCompleted() {
    this.markAsCompleted.emit();
    this.showMarkModal.set(false);
  }

  closeForm() {
    this.showDeleteConfirmModal.set(false);
  }

  export() {
    this.handleExport.emit(this.exportForm.value);
  }
}
