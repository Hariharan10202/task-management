import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-task-filter',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-filter.html',
  styleUrl: './task-filter.css',
})
export class TaskFilter {
  @Output() filtersChanged = new EventEmitter<{
    search: string;
    status: string;
    priority: string;
  }>();

  form = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    priority: new FormControl(''),
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
    });
  }
}
