import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-pagination',
  standalone: true,
  imports: [],
  templateUrl: './task-pagination.html',
  styleUrl: './task-pagination.css',
})
export class TaskPagination {
  @Input() page = 1;
  @Input() totalPages: number | null = null;
  @Input() hasMore = true;

  @Output() pageChange = new EventEmitter<number>();

  next() {
    if (!this.hasMore) return;

    const nextPage = this.page + 1;
    this.pageChange.emit(nextPage);
  }

  prev() {
    if (this.page <= 1) return;

    const prevPage = this.page - 1;
    this.pageChange.emit(prevPage);
  }
}
